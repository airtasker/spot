import fs from "fs-extra";
import path from "path";
import ts from "typescript";
import { isHttpMethod } from "./lib";
import {
  Api,
  arrayType,
  ArrayType,
  BOOLEAN,
  DynamicPathComponent,
  Endpoint,
  NULL,
  NUMBER,
  ObjectType,
  objectType,
  optionalType,
  PathComponent,
  STRING,
  Type,
  unionType,
  VOID
} from "./models";
import { validate } from "./validator";

export async function parsePath(sourcePath: string): Promise<Api> {
  const api: Api = {
    endpoints: {},
    types: {}
  };
  await parseFileRecursively(api, new Set(), sourcePath);
  const errors = validate(api);
  if (errors.length > 0) {
    throw panic(errors.join("\n"));
  }
  return api;
}

async function parseFileRecursively(
  api: Api,
  visitedPaths: Set<string>,
  sourcePath: string
): Promise<void> {
  if (!(await fs.existsSync(sourcePath))) {
    if (await fs.existsSync(sourcePath + ".ts")) {
      sourcePath += ".ts";
    } else {
      throw panic(`No source file found at ${sourcePath}`);
    }
  }
  if (visitedPaths.has(sourcePath) || sourcePath.startsWith(__dirname)) {
    return;
  } else {
    visitedPaths.add(sourcePath);
  }
  const fileContent = await fs.readFile(sourcePath, "utf8");
  const sourceFile = ts.createSourceFile(
    path.basename(sourcePath),
    fileContent,
    ts.ScriptTarget.Latest
  );
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (!ts.isStringLiteral(statement.moduleSpecifier)) {
        throw panic(
          `Unsupported import statement: ${statement.moduleSpecifier.getText(
            sourceFile
          )}`
        );
      }
      const importPath = statement.moduleSpecifier.text;
      if (!importPath.startsWith(".")) {
        // This is not a relative import, we'll ignore it.
        continue;
      }
      await parseFileRecursively(
        api,
        visitedPaths,
        path.join(sourcePath, "..", importPath)
      );
    } else if (ts.isClassDeclaration(statement)) {
      const apiDecorator = extractSingleDecorator(sourceFile, statement, "api");
      if (apiDecorator) {
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
}

function parseApiDeclaration(
  sourceFile: ts.SourceFile,
  classDeclaration: ts.ClassDeclaration,
  api: Api
): void {
  for (const member of classDeclaration.members) {
    if (ts.isMethodDeclaration(member)) {
      const endpointDecorator = extractSingleDecorator(
        sourceFile,
        member,
        "endpoint"
      );
      const errorDecorators = extractDecorators(sourceFile, member, "error");
      if (endpointDecorator) {
        const endpointName = member.name.getText(sourceFile);
        if (api.endpoints[endpointName]) {
          throw panic(
            `Found multiple definitions of the same endpoint ${endpointName}`
          );
        }
        if (endpointDecorator.arguments.length !== 1) {
          throw panic(
            `Expected exactly one argument for @endpoint(), got ${
              endpointDecorator.arguments.length
            }`
          );
        }
        api.endpoints[endpointName] = extractEndpoint(
          sourceFile,
          endpointDecorator.arguments[0],
          errorDecorators,
          member
        );
      }
    }
  }
}

function extractEndpoint(
  sourceFile: ts.SourceFile,
  endpointDescriptionExpression: ts.Expression,
  errorDecorators: Decorator[],
  methodDeclaration: ts.MethodDeclaration
): Endpoint {
  const endpointDescription = extractLiteral(
    sourceFile,
    endpointDescriptionExpression
  );
  if (!isObjectLiteral(endpointDescription)) {
    throw panic(
      `@endpoint() expects an object literal, got this instead: ${endpointDescriptionExpression.getText(
        sourceFile
      )}`
    );
  }
  const methodLiteral = endpointDescription.properties["method"];
  const pathLiteral = endpointDescription.properties["path"];
  if (!isStringLiteral(methodLiteral)) {
    throw panic(
      `Invalid method in endpoint description: ${endpointDescriptionExpression.getText(
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
      `Invalid path in endpoint description: ${endpointDescriptionExpression.getText(
        sourceFile
      )}`
    );
  }
  const path = pathLiteral.text;
  const pathComponents: PathComponent[] = [];
  const dynamicPathComponents: { [name: string]: DynamicPathComponent } = {};
  if (path.length > 0) {
    let componentStartPosition = 0;
    do {
      if (path.charAt(componentStartPosition) === ":") {
        // The parameter name extends until a character that isn't a valid name.
        const nextNonNamePositionRelative = path
          .substr(componentStartPosition + 1)
          .search(/[^a-z0-9_]/gi);
        const dynamicPathComponent: DynamicPathComponent = {
          kind: "dynamic",
          name: path.substr(
            componentStartPosition + 1,
            nextNonNamePositionRelative === -1
              ? undefined
              : nextNonNamePositionRelative
          ),
          type: VOID
        };
        pathComponents.push(dynamicPathComponent);
        dynamicPathComponents[dynamicPathComponent.name] = dynamicPathComponent;
        componentStartPosition =
          nextNonNamePositionRelative === -1
            ? -1
            : componentStartPosition + 1 + nextNonNamePositionRelative;
      } else {
        // The static component extends until the next parameter, which starts with ":".
        const nextColumnPosition = path.indexOf(":", componentStartPosition);
        pathComponents.push({
          kind: "static",
          content: path.substring(
            componentStartPosition,
            nextColumnPosition === -1 ? undefined : nextColumnPosition
          )
        });
        componentStartPosition = nextColumnPosition;
      }
    } while (componentStartPosition !== -1);
  }
  let requestType: Type = VOID;
  for (const parameter of methodDeclaration.parameters) {
    const requestDecorator = extractSingleDecorator(
      sourceFile,
      parameter,
      "request"
    );
    const pathParamDecorator = extractSingleDecorator(
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
    if (requestDecorator) {
      requestType = type;
    } else if (pathParamDecorator) {
      const name = parameter.name.getText(sourceFile);
      if (dynamicPathComponents[name]) {
        dynamicPathComponents[name].type = type;
      } else {
        throw panic(
          `Found a path parameter that isn't present in path. Expected one of [${Object.keys(
            dynamicPathComponents
          ).join(", ")}], got this instead: ${name}`
        );
      }
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
      ts.isTypeReferenceNode(methodDeclaration.type) &&
      ts.isIdentifier(methodDeclaration.type.typeName) &&
      methodDeclaration.type.typeName.escapedText === "Promise"
    ) {
      if (
        !methodDeclaration.type.typeArguments ||
        methodDeclaration.type.typeArguments.length !== 1
      ) {
        throw panic(
          `Expected Promise<...>, got this instead: ${methodDeclaration.type.getText(
            sourceFile
          )}`
        );
      }
      const promisedType = methodDeclaration.type.typeArguments[0];
      responseType = extractType(sourceFile, promisedType);
    } else {
      responseType = extractType(sourceFile, methodDeclaration.type);
    }
  }
  let defaultErrorType: Type = VOID;
  let customErrorTypes: {
    [statusCode: number]: Type;
  } = {};
  let defaultErrorDefined = false;
  for (const errorDecorator of errorDecorators) {
    if (errorDecorator.typeParameters.length !== 1) {
      throw panic(
        `Expected exactly one type parameter for @error(), got ${
          errorDecorator.typeParameters.length
        }`
      );
    }
    const errorResponseType = extractType(
      sourceFile,
      errorDecorator.typeParameters[0]
    );
    if (errorDecorator.arguments.length > 1) {
      throw panic(
        `Expected at most one argument for @error(), got ${
          errorDecorator.arguments.length
        }`
      );
    }
    let errorDescription: Literal;
    if (errorDecorator.arguments.length === 1) {
      errorDescription = extractLiteral(
        sourceFile,
        errorDecorator.arguments[0]
      );
      if (!isObjectLiteral(errorDescription)) {
        throw panic(
          `@error() expects an object literal, got this instead: ${errorDecorator.arguments[0].getText(
            sourceFile
          )}`
        );
      }
    } else {
      errorDescription = {
        kind: "object",
        properties: {}
      };
    }
    const statusCode = errorDescription.properties["statusCode"];
    if (statusCode) {
      if (!isNumericLiteral(statusCode)) {
        throw panic(
          `@error() expects a numeric status code, got this instead: ${errorDecorator.arguments[0].getText(
            sourceFile
          )}`
        );
      }
      // TODO: Ensure that it's an integer.
      customErrorTypes[parseInt(statusCode.text)] = errorResponseType;
    } else {
      if (defaultErrorDefined) {
        throw panic(
          `@error() cannot be called without a status multiple times.`
        );
      }
      defaultErrorType = errorResponseType;
      defaultErrorDefined = true;
    }
  }
  return {
    method,
    path: pathComponents,
    requestType,
    responseType,
    defaultErrorType,
    customErrorTypes
  };
}

function extractType(sourceFile: ts.SourceFile, type: ts.Node): Type {
  switch (type.kind) {
    case ts.SyntaxKind.VoidKeyword:
      return VOID;
    case ts.SyntaxKind.StringKeyword:
      return STRING;
    case ts.SyntaxKind.NumberKeyword:
      return NUMBER;
    case ts.SyntaxKind.BooleanKeyword:
      return BOOLEAN;
  }
  if (ts.isTypeLiteralNode(type)) {
    return extractObjectType(sourceFile, type);
  } else if (ts.isArrayTypeNode(type)) {
    return extractArrayType(sourceFile, type);
  } else if (ts.isLiteralTypeNode(type)) {
    const literal = extractLiteral(sourceFile, type.literal);
    switch (literal.kind) {
      case "string": {
        return {
          kind: "string-constant",
          value: literal.text
        };
      }
      case "number": {
        if (!literal.text.match(/^-?\d+$/)) {
          throw panic(
            `Expected an integer, got this instead: ${type.getText(sourceFile)}`
          );
        }
        return {
          kind: "integer-constant",
          value: parseInt(literal.text)
        };
      }
      case "boolean": {
        return {
          kind: "boolean-constant",
          value: literal.value
        };
      }
      default:
        throw panic(
          `Unexpected literal in type definition: ${type.getText(sourceFile)}`
        );
    }
  } else if (ts.isToken(type) && type.kind === ts.SyntaxKind.NullKeyword) {
    return NULL;
  } else if (ts.isUnionTypeNode(type)) {
    return extractUnionType(sourceFile, type);
  } else if (ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
    return {
      kind: "type-reference",
      typeName: type.typeName.getText(sourceFile)
    };
  } else {
    throw panic(
      `Expected a plain type identifier, got this instead: ${type.getText(
        sourceFile
      )}`
    );
  }
}

function extractObjectType(
  sourceFile: ts.SourceFile,
  declaration: ts.TypeLiteralNode | ts.InterfaceDeclaration
): ObjectType {
  const properties: {
    [key: string]: Type;
  } = {};
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
    properties[member.name.getText(sourceFile)] = type;
  }
  return objectType(properties);
}

function extractArrayType(
  sourceFile: ts.SourceFile,
  declaration: ts.ArrayTypeNode
): ArrayType {
  return arrayType(extractType(sourceFile, declaration.elementType));
}

function extractUnionType(
  sourceFile: ts.SourceFile,
  declaration: ts.UnionTypeNode
): Type {
  return unionType(...declaration.types.map(t => extractType(sourceFile, t)));
}

type Literal =
  | ObjectLiteral
  | ArrayLiteral
  | StringLiteral
  | NumericLiteral
  | BooleanLiteral;

function extractLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.Node
): Literal {
  if (ts.isObjectLiteralExpression(expression)) {
    return extractObjectLiteral(sourceFile, expression);
  } else if (ts.isArrayLiteralExpression(expression)) {
    return extractArrayLiteral(sourceFile, expression);
  } else if (ts.isStringLiteral(expression)) {
    return extractStringLiteral(sourceFile, expression);
  } else if (ts.isNumericLiteral(expression)) {
    return extractNumericLiteral(sourceFile, expression);
  } else if (
    expression.kind === ts.SyntaxKind.TrueKeyword ||
    expression.kind === ts.SyntaxKind.FalseKeyword
  ) {
    return extractBooleanLiteral(sourceFile, expression);
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

interface NumericLiteral {
  kind: "number";
  text: string;
}

export function isNumericLiteral(literal?: Literal): literal is NumericLiteral {
  return literal !== undefined && literal.kind === "number";
}

function extractNumericLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.NumericLiteral
): NumericLiteral {
  const literal = expression.getText(sourceFile);
  return {
    kind: "number",
    text: literal
  };
}

interface BooleanLiteral {
  kind: "boolean";
  value: boolean;
}

export function isBooleanLiteral(literal?: Literal): literal is BooleanLiteral {
  return literal !== undefined && literal.kind === "boolean";
}

function extractBooleanLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.Node
): BooleanLiteral {
  return {
    kind: "boolean",
    value: expression.kind === ts.SyntaxKind.TrueKeyword
  };
}

function extractSingleDecorator(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  decoratorName: string
): Decorator | null {
  const decorators = extractDecorators(sourceFile, node, decoratorName);
  if (decorators.length === 1) {
    return decorators[0];
  } else if (decorators.length > 1) {
    throw panic(
      `Expected a single @${decoratorName} decorator, found ${
        decorators.length
      }`
    );
  } else {
    return null;
  }
}

function extractDecorators(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  decoratorName: string
): Decorator[] {
  const decorators: Decorator[] = [];
  if (node.decorators) {
    for (const decorator of node.decorators) {
      if (
        ts.isIdentifier(decorator.expression) &&
        decorator.expression.getText(sourceFile) === decoratorName
      ) {
        decorators.push({
          typeParameters: [],
          arguments: []
        });
      } else if (ts.isCallExpression(decorator.expression)) {
        if (
          ts.isIdentifier(decorator.expression.expression) &&
          decorator.expression.expression.getText(sourceFile) === decoratorName
        ) {
          decorators.push({
            typeParameters: [...(decorator.expression.typeArguments || [])],
            arguments: [...decorator.expression.arguments]
          });
        }
      }
    }
  }
  return decorators;
}

interface Decorator {
  typeParameters: ts.TypeNode[];
  arguments: ts.Expression[];
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
