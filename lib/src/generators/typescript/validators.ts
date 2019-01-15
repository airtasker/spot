import assertNever from "assert-never";
import * as ts from "typescript";
import {
  Api,
  ArrayType,
  BOOLEAN,
  normalizedObjectType,
  ObjectType,
  OptionalType,
  Type,
  TypeReference,
  Types,
  UnionType
} from "../../models";
import { outputTypeScriptSource } from "./ts-writer";
import { typeNode } from "./types";
import flatten = require("lodash/flatten");
import compact = require("lodash/compact");

export function generateValidatorsSource(api: Api): string {
  const typeNames = Object.keys(api.types);
  return outputTypeScriptSource([
    ...(typeNames.length > 0
      ? [
          ts.createImportDeclaration(
            /*decorators*/ undefined,
            /*modifiers*/ undefined,
            ts.createImportClause(
              /*name*/ undefined,
              ts.createNamedImports(
                typeNames.map(typeName =>
                  ts.createImportSpecifier(
                    /*propertyName*/ undefined,
                    ts.createIdentifier(typeName)
                  )
                )
              )
            ),
            ts.createStringLiteral("./types")
          )
        ]
      : []),
    ...flatten(
      Object.entries(api.endpoints).map(([endpointName, endpoint]) => [
        generateValidator(
          api.types,
          endpointPropertyTypeName(endpointName, "request"),
          endpoint.requestType
        ),
        ...compact(
          endpoint.path.map(
            pathComponent =>
              pathComponent.kind === "dynamic"
                ? generateValidator(
                    api.types,
                    endpointPropertyTypeName(
                      endpointName,
                      "param",
                      pathComponent.name
                    ),
                    pathComponent.type
                  )
                : null
          )
        ),
        ...Object.entries(endpoint.headers).map(([headerName, header]) =>
          generateValidator(
            api.types,
            endpointPropertyTypeName(endpointName, "header", headerName),
            header.type
          )
        ),
        ...endpoint.queryParams.map(queryParam =>
          generateValidator(
            api.types,
            endpointPropertyTypeName(endpointName, "param", queryParam.name),
            queryParam.type
          )
        ),
        generateValidator(
          api.types,
          endpointPropertyTypeName(endpointName, "response"),
          endpoint.responseType
        ),
        generateValidator(
          api.types,
          endpointPropertyTypeName(endpointName, "genericError"),
          endpoint.genericErrorType
        ),
        ...Object.entries(endpoint.specificErrorTypes).map(
          ([name, specificError]) =>
            generateValidator(
              api.types,
              endpointPropertyTypeName(endpointName, `specificError`, name),
              specificError.type
            )
        )
      ])
    ),
    ...Object.entries(api.types).map(([typeName, type]) =>
      generateValidator(api.types, typeName, type, typeName)
    )
  ]);
}

function generateValidator(
  types: Types,
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
        : typeNode(types, type)
    ),
    ts.createBlock(
      [ts.createReturn(validator(types, type, parameterName))],
      /*multiline*/ true
    )
  );
}

function validator(
  types: Types,
  type: Type,
  parameter: ts.Expression
): ts.Expression {
  switch (type.kind) {
    case "void":
      return voidValidator(parameter);
    case "null":
      return nullValidator(parameter);
    case "boolean":
      return booleanValidator(parameter);
    case "boolean-constant":
      return booleanConstantValidator(type.value, parameter);
    case "date":
    case "date-time":
    case "string":
      return stringValidator(parameter);
    case "string-constant":
      return stringConstantValidator(type.value, parameter);
    case "int32":
    case "int64":
    case "float":
    case "double":
    case "number":
      return numberValidator(parameter);
    case "integer-constant":
      return integerConstantValidator(type.value, parameter);
    case "object":
      return objectValidator(types, type, parameter);
    case "array":
      return arrayValidator(types, type, parameter);
    case "optional":
      return optionalValidator(types, type, parameter);
    case "union":
      return unionValidator(types, type, parameter);
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
  types: Types,
  type: ObjectType,
  parameter: ts.Expression
): ts.Expression {
  let expression = notNullObjectValidator(parameter);
  for (const [propertyName, propertyType] of Object.entries(
    normalizedObjectType(types, type)
  )) {
    expression = ts.createLogicalAnd(
      expression,
      validator(
        types,
        propertyType,
        ts.createElementAccess(parameter, ts.createStringLiteral(propertyName))
      )
    );
  }
  return expression;
}

function arrayValidator(
  types: Types,
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
              accArgument,
              /*questionToken*/ undefined,
              typeNode(types, BOOLEAN)
            ),
            ts.createParameter(
              /*decorators*/ undefined,
              /*modifiers*/ undefined,
              /*dotDotDotToken*/ undefined,
              currArgument,
              /*questionToken*/ undefined,
              typeNode(types, BOOLEAN)
            )
          ],
          /*type*/ undefined,
          /*equalsGreaterThanToken*/ undefined,
          ts.createLogicalAnd(
            accArgument,
            validator(types, type.elements, currArgument)
          )
        ),
        ts.createIdentifier("true")
      ]
    )
  );
}

function optionalValidator(
  types: Types,
  type: OptionalType,
  parameter: ts.Expression
): ts.Expression {
  return ts.createLogicalOr(
    voidValidator(parameter),
    validator(types, type.optional, parameter)
  );
}

function unionValidator(
  types: Types,
  type: UnionType,
  parameter: ts.Expression
): ts.Expression {
  let expression = validator(types, type.types[0], parameter);
  for (let i = 1; i < type.types.length; i++) {
    expression = ts.createLogicalOr(
      expression,
      validator(types, type.types[i], parameter)
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

export function endpointPropertyTypeName(
  endpointName: string,
  property:
    | "request"
    | "param"
    | "header"
    | "response"
    | "genericError"
    | "specificError",
  suffix = ""
) {
  switch (property) {
    case "param":
    case "header":
    case "specificError":
      if (!suffix) {
        throw new Error(`Unexpected ${property} without a suffix`);
      }
      break;
    default:
      // No suffix required.
      if (suffix) {
        throw new Error(`Unexpected ${property} with a suffix`);
      }
  }
  return `${endpointName}_${property}${capitaliseFirstLetter(suffix)}`;
}

export function validatorName(typeName: string) {
  return `validate${capitaliseFirstLetter(typeName)}`;
}

function capitaliseFirstLetter(name: string) {
  if (name.length === 0) {
    return name;
  }
  return `${name[0].toUpperCase()}${name.substr(1)}`;
}

export function validateStatement(
  variable: ts.Expression,
  validatorName: string,
  errorMessage: string
): ts.Statement {
  return ts.createIf(
    ts.createLogicalNot(
      ts.createCall(
        ts.createPropertyAccess(
          ts.createIdentifier("validators"),
          validatorName
        ),
        /*typeArguments*/ undefined,
        [variable]
      )
    ),
    ts.createBlock(
      [
        ts.createThrow(
          ts.createNew(
            ts.createIdentifier("Error"),
            /*typeArguments*/ undefined,
            [
              ts.createTemplateExpression(
                ts.createTemplateHead(`${errorMessage}: `),
                [
                  ts.createTemplateSpan(
                    ts.createCall(
                      ts.createPropertyAccess(
                        ts.createIdentifier("JSON"),
                        "stringify"
                      ),
                      /*typeArguments*/ undefined,
                      [
                        variable,
                        ts.createIdentifier("null"),
                        ts.createNumericLiteral("2")
                      ]
                    ),
                    ts.createTemplateTail("")
                  )
                ]
              )
            ]
          )
        )
      ],
      /*multiLine*/ true
    )
  );
}
