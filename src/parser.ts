import ts from "typescript";
import { isHttpMethod } from "./lib";
import {
  Api,
  BOOLEAN,
  Endpoint,
  NUMBER,
  ObjectType,
  optionalType,
  Param,
  STRING,
  Type,
  VOID
} from "./models";
import { validate } from "./validator";

export function parse(source: string): Api {
  const sourceFile = ts.createSourceFile(
    "api.ts",
    source,
    ts.ScriptTarget.Latest
  );
  const api: Api = {
    endpoints: {},
    types: {}
  };
  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      const [hasApiDecorator] = extractDecorator(sourceFile, statement, "api");
      if (hasApiDecorator) {
        parseApiDeclaration(sourceFile, statement, api);
      }
    } else if (ts.isTypeAliasDeclaration(statement)) {
      const name = statement.name.getText(sourceFile);
      api.types[name] = extractType(sourceFile, statement.type);
    } else if (ts.isInterfaceDeclaration(statement)) {
      const name = statement.name.getText(sourceFile);
      api.types[name] = extractObjectType(sourceFile, statement);
    }
  }
  const errors = validate(api);
  if (errors.length > 0) {
    throw panic(errors.map(e => e.message).join("\n"));
  }
  return api;
}

function parseApiDeclaration(
  sourceFile: ts.SourceFile,
  classDeclaration: ts.ClassDeclaration,
  api: Api
): void {
  for (const member of classDeclaration.members) {
    if (ts.isMethodDeclaration(member)) {
      const [hasEndpointDecorator, ...endpointArgs] = extractDecorator(
        sourceFile,
        member,
        "endpoint"
      );
      if (hasEndpointDecorator) {
        api.endpoints[member.name.getText(sourceFile)] = extractEndpoint(
          sourceFile,
          endpointArgs[0],
          member
        );
      }
    }
  }
}

function extractEndpoint(
  sourceFile: ts.SourceFile,
  decoratorValue: ts.Expression,
  methodDeclaration: ts.MethodDeclaration
): Endpoint {
  const parsedEndpointDescription = extractLiteral(sourceFile, decoratorValue);
  if (!isObjectLiteral(parsedEndpointDescription)) {
    throw panic(
      `@endpoint() expects an object literal, got this instead: ${decoratorValue.getText(
        sourceFile
      )}`
    );
  }
  const methodLiteral = parsedEndpointDescription.properties["method"];
  const pathLiteral = parsedEndpointDescription.properties["path"];
  if (!isStringLiteral(methodLiteral)) {
    throw panic(
      `Invalid method in endpoint description: ${decoratorValue.getText(
        sourceFile
      )}`
    );
  }
  const method = methodLiteral.text;
  if (!isHttpMethod(method)) {
    throw panic(`${method} is not a valid HTTP method`);
  }
  if (!isStringLiteral(pathLiteral)) {
    throw panic(
      `Invalid path in endpoint description: ${decoratorValue.getText(
        sourceFile
      )}`
    );
  }
  const path = pathLiteral.text;
  const params: Param[] = [];
  let requestType: Type = VOID;
  for (const parameter of methodDeclaration.parameters) {
    const [hasRequestDecorator] = extractDecorator(
      sourceFile,
      parameter,
      "request"
    );
    const [hasPathParamDecorator] = extractDecorator(
      sourceFile,
      parameter,
      "pathParam"
    );
    if (!ts.isIdentifier(parameter.name)) {
      throw panic(
        `Expected a plain identifier for endpoint parameter name, got this instead: ${parameter.getText(
          sourceFile
        )}`
      );
    }
    if (!parameter.type) {
      throw panic(
        `Expected a type for endpoint parameter: ${parameter.getText(
          sourceFile
        )}`
      );
    }
    const type = extractType(sourceFile, parameter.type);
    if (hasRequestDecorator) {
      requestType = type;
    } else if (hasPathParamDecorator) {
      params.push({
        name: parameter.name.getText(sourceFile),
        type
      });
    } else {
      throw panic(
        `Found a parameter without @request or @pathParam: ${parameter.getText(
          sourceFile
        )}`
      );
    }
  }
  let responseType: Type = VOID;
  if (methodDeclaration.type) {
    if (
      !ts.isTypeReferenceNode(methodDeclaration.type) ||
      !ts.isIdentifier(methodDeclaration.type.typeName) ||
      methodDeclaration.type.typeName.escapedText !== "Promise" ||
      !methodDeclaration.type.typeArguments ||
      methodDeclaration.type.typeArguments.length !== 1
    ) {
      throw panic(
        `Expected Promise<...> as return type for endpoint method, got this instead: ${methodDeclaration.type.getText(
          sourceFile
        )}`
      );
    }
    const promisedType = methodDeclaration.type.typeArguments[0];
    responseType = extractType(sourceFile, promisedType);
  }
  return {
    method,
    path,
    params,
    requestType,
    responseType
  };
}

function extractType(sourceFile: ts.SourceFile, type: ts.Node): Type {
  switch (type.kind) {
    case ts.SyntaxKind.StringKeyword:
      return STRING;
    case ts.SyntaxKind.NumberKeyword:
      return NUMBER;
    case ts.SyntaxKind.BooleanKeyword:
      return BOOLEAN;
  }
  if (ts.isTypeLiteralNode(type)) {
    return extractObjectType(sourceFile, type);
  }
  if (!ts.isTypeReferenceNode(type) || !ts.isIdentifier(type.typeName)) {
    throw panic(
      `Expected a plain type identifier, got this instead: ${type.getText(
        sourceFile
      )}`
    );
  }
  return {
    kind: "type-reference",
    typeName: type.typeName.getText(sourceFile)
  };
}

function extractObjectType(
  sourceFile: ts.SourceFile,
  declaration: ts.TypeLiteralNode | ts.InterfaceDeclaration
): ObjectType {
  const objectType: ObjectType = { kind: "object", properties: {} };
  for (const member of declaration.members) {
    if (
      !member.name ||
      !ts.isIdentifier(member.name) ||
      !ts.isPropertySignature(member) ||
      !member.type
    ) {
      throw panic(
        `Expected a named and typed property, got this instead: ${member.getText(
          sourceFile
        )}`
      );
    }
    let type = extractType(sourceFile, member.type);
    if (member.questionToken) {
      type = optionalType(type);
    }
    objectType.properties[member.name.getText(sourceFile)] = type;
  }
  return objectType;
}

type Literal = ObjectLiteral | ArrayLiteral | StringLiteral;

function extractLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.Expression
): Literal {
  if (ts.isObjectLiteralExpression(expression)) {
    return extractObjectLiteral(sourceFile, expression);
  } else if (ts.isArrayLiteralExpression(expression)) {
    return extractArrayLiteral(sourceFile, expression);
  } else if (ts.isStringLiteral(expression)) {
    return extractStringLiteral(sourceFile, expression);
  } else {
    throw panic(`Expected a literal, found ${expression.getText(sourceFile)}`);
  }
}

interface ObjectLiteral {
  kind: "object";
  properties: {
    [key: string]: Literal;
  };
}

export function isObjectLiteral(literal?: Literal): literal is ObjectLiteral {
  return literal !== undefined && literal.kind === "object";
}

function extractObjectLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.ObjectLiteralExpression
): ObjectLiteral {
  const objectLiteral: ObjectLiteral = {
    kind: "object",
    properties: {}
  };
  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw panic(
        `Unsupported property syntax: ${property.getText(sourceFile)}`
      );
    }
    if (!ts.isIdentifier(property.name)) {
      throw panic(
        `The following should be a plain identifier: ${property.name.getText(
          sourceFile
        )}`
      );
    }
    objectLiteral.properties[
      property.name.getText(sourceFile)
    ] = extractLiteral(sourceFile, property.initializer);
  }
  return objectLiteral;
}

interface ArrayLiteral {
  kind: "array";
  elements: Literal[];
}

export function isArrayLiteral(literal?: Literal): literal is ArrayLiteral {
  return literal !== undefined && literal.kind === "array";
}

function extractArrayLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.ArrayLiteralExpression
): ArrayLiteral {
  return {
    kind: "array",
    elements: expression.elements.map(e => extractLiteral(sourceFile, e))
  };
}

interface StringLiteral {
  kind: "string";
  text: string;
}

export function isStringLiteral(literal?: Literal): literal is StringLiteral {
  return literal !== undefined && literal.kind === "string";
}

function extractStringLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.StringLiteral
): StringLiteral {
  const literal = expression.getText(sourceFile);
  return {
    kind: "string",
    // TODO: Unescape strings.
    text: literal.substr(1, literal.length - 2)
  };
}

function extractDecorator(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  decoratorName: string
): [boolean, ...ts.Expression[]] {
  if (node.decorators) {
    for (const decorator of node.decorators) {
      if (
        ts.isIdentifier(decorator.expression) &&
        decorator.expression.getText(sourceFile) === decoratorName
      ) {
        return [true];
      } else if (ts.isCallExpression(decorator.expression)) {
        if (
          ts.isIdentifier(decorator.expression.expression) &&
          decorator.expression.expression.getText(sourceFile) === decoratorName
        ) {
          return [true, ...decorator.expression.arguments];
        }
      }
    }
  }
  return [false];
}

function panic(nodeOrMessage: ts.Node | string) {
  if (typeof nodeOrMessage === "string") {
    return new Error(nodeOrMessage);
  }
  let syntaxKind = "unknown";
  for (const [key, value] of Object.entries(ts.SyntaxKind)) {
    if (nodeOrMessage.kind === value) {
      syntaxKind = key;
      break;
    }
  }
  return new Error(syntaxKind + ": " + JSON.stringify(nodeOrMessage, null, 2));
}
