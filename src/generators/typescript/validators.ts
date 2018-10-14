import assertNever from "assert-never";
import ts from "typescript";
import {
  Api,
  ArrayType,
  ObjectType,
  OptionalType,
  Type,
  TypeReference,
  UnionType
} from "../../models";
import { typeNode } from "./types";

export function generateValidatorsSource(api: Api) {
  const statements: ts.Statement[] = [];
  for (const [endpointName, endpoint] of Object.entries(api.endpoints)) {
    statements.push(
      generateValidator(
        endpointPropertyTypeName(endpointName, "request"),
        endpoint.requestType
      )
    );
    statements.push(
      generateValidator(
        endpointPropertyTypeName(endpointName, "response"),
        endpoint.responseType
      )
    );
    statements.push(
      generateValidator(
        endpointPropertyTypeName(endpointName, "defaultError"),
        endpoint.defaultErrorType
      )
    );
    for (const [statusCode, customErrorType] of Object.entries(
      endpoint.customErrorTypes
    )) {
      statements.push(
        generateValidator(
          endpointPropertyTypeName(endpointName, `customError${statusCode}`),
          customErrorType
        )
      );
    }
  }
  for (const [typeName, type] of Object.entries(api.types)) {
    statements.push(generateValidator(typeName, type, typeName));
  }
  const sourceFile = ts.createSourceFile(
    "validators.ts",
    "",
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  );
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
  });
  return statements
    .map(s => printer.printNode(ts.EmitHint.Unspecified, s, sourceFile))
    .join("\n\n");
}

function generateValidator(
  typeNickname: string,
  type: Type,
  typeName?: string
): ts.Statement {
  const parameterName = ts.createIdentifier("value");
  return ts.createFunctionDeclaration(
    /*decorators*/ undefined,
    /*modifiers*/ [ts.createToken(ts.SyntaxKind.ExportKeyword)],
    /*asteriskToken*/ undefined,
    ts.createIdentifier(validatorName(typeNickname)),
    /*typeParameters*/ undefined,
    [
      ts.createParameter(
        /*decorators*/ undefined,
        /*modifiers*/ undefined,
        /*dotDotDotToken*/ undefined,
        parameterName,
        /*questionToken*/ undefined,
        ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      )
    ],
    /*returnType*/ ts.createTypePredicateNode(
      parameterName,
      typeName
        ? ts.createTypeReferenceNode(typeName, /*typeArguments*/ undefined)
        : typeNode(type)
    ),
    ts.createBlock(
      [ts.createReturn(validator(type, parameterName))],
      /*multiline*/ true
    )
  );
}

function validator(type: Type, parameter: ts.Expression): ts.Expression {
  switch (type.kind) {
    case "void":
      return voidValidator(parameter);
    case "null":
      return nullValidator(parameter);
    case "boolean":
      return booleanValidator(parameter);
    case "boolean-constant":
      return booleanConstantValidator(type.value, parameter);
    case "string":
      return stringValidator(parameter);
    case "string-constant":
      return stringConstantValidator(type.value, parameter);
    case "number":
      return numberValidator(parameter);
    case "integer-constant":
      return integerConstantValidator(type.value, parameter);
    case "object":
      return objectValidator(type, parameter);
    case "array":
      return arrayValidator(type, parameter);
    case "optional":
      return optionalValidator(type, parameter);
    case "union":
      return unionValidator(type, parameter);
    case "type-reference":
      return typeReferenceValidator(type, parameter);
    default:
      throw assertNever(type);
  }
}

function voidValidator(parameter: ts.Expression): ts.Expression {
  return ts.createStrictEquality(parameter, ts.createIdentifier("undefined"));
}

function nullValidator(parameter: ts.Expression): ts.Expression {
  return ts.createStrictEquality(parameter, ts.createIdentifier("null"));
}

function booleanValidator(parameter: ts.Expression): ts.Expression {
  return ts.createStrictEquality(
    ts.createTypeOf(parameter),
    ts.createStringLiteral("boolean")
  );
}

function stringValidator(parameter: ts.Expression): ts.Expression {
  return ts.createStrictEquality(
    ts.createTypeOf(parameter),
    ts.createStringLiteral("string")
  );
}

function numberValidator(parameter: ts.Expression): ts.Expression {
  return ts.createStrictEquality(
    ts.createTypeOf(parameter),
    ts.createStringLiteral("number")
  );
}

function notNullObjectValidator(parameter: ts.Expression): ts.Expression {
  return ts.createLogicalAnd(
    ts.createLogicalNot(nullValidator(parameter)),
    ts.createStrictEquality(
      ts.createTypeOf(parameter),
      ts.createStringLiteral("object")
    )
  );
}

function booleanConstantValidator(
  value: boolean,
  parameter: ts.Expression
): ts.Expression {
  return ts.createStrictEquality(
    parameter,
    ts.createIdentifier(value ? "true" : "false")
  );
}

function stringConstantValidator(
  value: string,
  parameter: ts.Expression
): ts.Expression {
  return ts.createStrictEquality(parameter, ts.createStringLiteral(value));
}

function integerConstantValidator(
  value: number,
  parameter: ts.Expression
): ts.Expression {
  return ts.createStrictEquality(
    parameter,
    ts.createNumericLiteral(value.toString(10))
  );
}

function objectValidator(
  type: ObjectType,
  parameter: ts.Expression
): ts.Expression {
  let expression = notNullObjectValidator(parameter);
  for (const [propertyName, propertyType] of Object.entries(type.properties)) {
    expression = ts.createLogicalAnd(
      expression,
      validator(
        propertyType,
        ts.createElementAccess(parameter, ts.createStringLiteral(propertyName))
      )
    );
  }
  return expression;
}

function arrayValidator(
  type: ArrayType,
  parameter: ts.Expression
): ts.Expression {
  const accArgument = ts.createIdentifier("acc");
  const currArgument = ts.createIdentifier("curr");
  return ts.createLogicalAnd(
    ts.createBinary(
      parameter,
      ts.SyntaxKind.InstanceOfKeyword,
      ts.createIdentifier("Array")
    ),
    ts.createCall(
      ts.createPropertyAccess(parameter, "reduce"),
      /*typeArguments*/ undefined,
      [
        ts.createArrowFunction(
          /*modifiers*/ undefined,
          /*typeParameters*/ undefined,
          [
            ts.createParameter(
              /*decorators*/ undefined,
              /*modifiers*/ undefined,
              /*dotDotDotToken*/ undefined,
              accArgument
            ),
            ts.createParameter(
              /*decorators*/ undefined,
              /*modifiers*/ undefined,
              /*dotDotDotToken*/ undefined,
              currArgument
            )
          ],
          /*type*/ undefined,
          /*equalsGreaterThanToken*/ undefined,
          ts.createLogicalAnd(
            accArgument,
            validator(type.elements, currArgument)
          )
        ),
        ts.createIdentifier("true")
      ]
    )
  );
}

function optionalValidator(
  type: OptionalType,
  parameter: ts.Expression
): ts.Expression {
  return ts.createLogicalOr(
    voidValidator(parameter),
    validator(type.optional, parameter)
  );
}

function unionValidator(
  type: UnionType,
  parameter: ts.Expression
): ts.Expression {
  let expression = validator(type.types[0], parameter);
  for (let i = 1; i < type.types.length; i++) {
    expression = ts.createLogicalOr(
      expression,
      validator(type.types[i], parameter)
    );
  }
  return expression;
}

function typeReferenceValidator(type: TypeReference, parameter: ts.Expression) {
  return ts.createCall(
    ts.createIdentifier(validatorName(type.typeName)),
    /*typeArguments*/ undefined,
    [parameter]
  );
}

function endpointPropertyTypeName(endpointName: string, property: string) {
  return `${endpointName}_${property}`;
}

function validatorName(typeName: string) {
  return `validate${typeName[0].toUpperCase()}${typeName.substr(1)}`;
}
