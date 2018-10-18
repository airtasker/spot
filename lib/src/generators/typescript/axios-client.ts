import assertNever from "assert-never";
import * as ts from "typescript";
import {
  Api,
  DynamicPathComponent,
  Endpoint,
  objectType,
  PathComponent,
  stringConstant,
  Type,
  unionType
} from "../../models";
import { outputTypeScriptSource } from "./ts-writer";
import { typeNode } from "./types";
import { endpointPropertyTypeName, validatorName } from "./validators";

const IMPORTED_AXIOS_NAME = "axios";

export function generateAxiosClientSource(api: Api): string {
  const statements: ts.Statement[] = [];
  statements.push(
    ts.createImportDeclaration(
      /*decorators*/ undefined,
      /*modifiers*/ undefined,
      ts.createImportClause(
        ts.createIdentifier(IMPORTED_AXIOS_NAME),
        /*namedBindings*/ undefined
      ),
      ts.createStringLiteral("axios")
    )
  );
  const typeNames = Object.keys(api.types);
  if (typeNames.length > 0) {
    statements.push(
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
    );
  }
  statements.push(
    ts.createImportDeclaration(
      /*decorators*/ undefined,
      /*modifiers*/ undefined,
      ts.createImportClause(
        /*name*/ undefined,
        ts.createNamespaceImport(ts.createIdentifier("validators"))
      ),
      ts.createStringLiteral("./validators")
    )
  );
  for (const [endpointName, endpoint] of Object.entries(api.endpoints)) {
    statements.push(generateEndpointFunction(endpointName, endpoint));
  }
  return outputTypeScriptSource(statements);
}

const REQUEST_PARAMETER = "request";

function generateEndpointFunction(
  endpointName: string,
  endpoint: Endpoint
): ts.FunctionDeclaration {
  const parameters: ts.ParameterDeclaration[] = [];
  if (endpoint.requestType.kind !== "void") {
    parameters.push(
      ts.createParameter(
        /*decorators*/ undefined,
        /*modifiers*/ undefined,
        /*dotDotDotToken*/ undefined,
        REQUEST_PARAMETER,
        /*questionToken*/ undefined,
        typeNode(endpoint.requestType)
      )
    );
  }
  for (const pathComponent of endpoint.path) {
    if (pathComponent.kind === "dynamic") {
      parameters.push(
        ts.createParameter(
          /*decorators*/ undefined,
          /*modifiers*/ undefined,
          /*dotDotDotToken*/ undefined,
          pathComponent.name,
          /*questionToken*/ undefined,
          typeNode(pathComponent.type)
        )
      );
    }
  }
  return ts.createFunctionDeclaration(
    /*decorators*/ undefined,
    [
      ts.createToken(ts.SyntaxKind.ExportKeyword),
      ts.createToken(ts.SyntaxKind.AsyncKeyword)
    ],
    /*asteriskToken*/ undefined,
    endpointName,
    /*typeParameters*/ undefined,
    parameters,
    /*type*/ ts.createTypeReferenceNode("Promise", [
      typeNode(unionType(...generateReturnTypes(endpoint)))
    ]),
    generateEndpointBody(endpointName, endpoint)
  );
}

function generateReturnTypes(endpoint: Endpoint): Type[] {
  const types: Type[] = [];
  types.push(
    objectType({
      kind: stringConstant("success"),
      data: endpoint.responseType
    })
  );
  types.push(
    objectType({
      kind: stringConstant("unknown-error"),
      data: endpoint.defaultErrorType
    })
  );
  for (const [statusCode, type] of Object.entries(endpoint.customErrorTypes)) {
    types.push(
      objectType({
        kind: stringConstant(`error-${statusCode}`),
        data: type
      })
    );
  }
  return types;
}

function generateEndpointBody(
  endpointName: string,
  endpoint: Endpoint
): ts.FunctionBody {
  const statements: ts.Statement[] = [];
  statements.push(generateRequestValidation(endpointName, endpoint));
  for (const pathComponent of endpoint.path) {
    if (pathComponent.kind === "dynamic") {
      statements.push(
        generatePathParameterValidation(endpointName, pathComponent)
      );
    }
  }
  statements.push(generateAxiosCall(endpoint));
  statements.push(generateSwitchStatus(endpointName, endpoint));
  return ts.createBlock(statements, /*multiLine*/ true);
}

function generateRequestValidation(
  endpointName: string,
  endpoint: Endpoint
): ts.Statement {
  return validateStatement(
    ts.createIdentifier(REQUEST_PARAMETER),
    validatorName(endpointPropertyTypeName(endpointName, REQUEST_PARAMETER)),
    "Invalid request"
  );
}

function generatePathParameterValidation(
  endpointName: string,
  pathComponent: DynamicPathComponent
): ts.Statement {
  return validateStatement(
    ts.createIdentifier(pathComponent.name),
    validatorName(
      endpointPropertyTypeName(endpointName, "param", pathComponent.name)
    ),
    `Invalid parameter ${pathComponent.name}:`
  );
}

const RESPONSE_NAME = "response";
const RESPONSE_STATUS_CODE = ts.createPropertyAccess(
  ts.createIdentifier(RESPONSE_NAME),
  "status"
);
const RESPONSE_DATA = ts.createPropertyAccess(
  ts.createIdentifier(RESPONSE_NAME),
  "data"
);

function generateAxiosCall(endpoint: Endpoint): ts.Statement {
  return ts.createVariableStatement(
    /*modifiers*/ undefined,
    ts.createVariableDeclarationList(
      [
        ts.createVariableDeclaration(
          RESPONSE_NAME,
          /*type*/ undefined,
          ts.createAwait(
            ts.createCall(
              ts.createIdentifier(IMPORTED_AXIOS_NAME),
              /*typeArguments*/ undefined,
              [
                ts.createObjectLiteral(
                  [
                    ts.createPropertyAssignment(
                      "url",
                      generatePath(endpoint.path)
                    ),
                    ts.createPropertyAssignment(
                      "method",
                      ts.createStringLiteral(endpoint.method)
                    ),
                    ts.createPropertyAssignment(
                      "responseType",
                      ts.createStringLiteral("json")
                    ),
                    ts.createPropertyAssignment(
                      "data",
                      ts.createIdentifier(REQUEST_PARAMETER)
                    ),
                    ts.createPropertyAssignment(
                      "validateStatus",
                      ts.createArrowFunction(
                        /*modifiers*/ undefined,
                        /*typeParameters*/ undefined,
                        [],
                        /*type*/ undefined,
                        /*equalsGreaterThanToken*/ undefined,
                        ts.createLiteral(true)
                      )
                    )
                  ],
                  /*multiLine*/ true
                )
              ]
            )
          )
        )
      ],
      ts.NodeFlags.Const
    )
  );
}

function generatePath(path: PathComponent[]): ts.Expression {
  let result: ts.Expression | null = null;
  for (const pathComponent of path) {
    let append;
    switch (pathComponent.kind) {
      case "static":
        append = ts.createStringLiteral(pathComponent.content);
        break;
      case "dynamic":
        append = ts.createIdentifier(pathComponent.name);
        break;
      default:
        throw assertNever(pathComponent);
    }
    if (!result) {
      result = append;
    } else {
      result = ts.createBinary(result, ts.SyntaxKind.PlusToken, append);
    }
  }
  if (!result) {
    result = ts.createStringLiteral("");
  }
  return result;
}

function generateSwitchStatus(
  endpointName: string,
  endpoint: Endpoint
): ts.Statement {
  return ts.createSwitch(
    RESPONSE_STATUS_CODE,
    ts.createCaseBlock([
      ...Object.keys(endpoint.customErrorTypes).map(statusCode =>
        ts.createCaseClause(ts.createNumericLiteral(statusCode), [
          validateStatement(
            RESPONSE_DATA,
            validatorName(
              endpointPropertyTypeName(endpointName, "customError", statusCode)
            ),
            `Invalid response for status code ${statusCode}`
          ),
          ts.createReturn(
            ts.createObjectLiteral(
              [
                ts.createPropertyAssignment(
                  "kind",
                  ts.createStringLiteral(`error-${statusCode}`)
                ),
                ts.createPropertyAssignment("data", RESPONSE_DATA)
              ],
              /*multiLine*/ true
            )
          )
        ])
      ),
      ts.createDefaultClause([
        ts.createIf(
          ts.createLogicalAnd(
            ts.createBinary(
              RESPONSE_STATUS_CODE,
              ts.SyntaxKind.GreaterThanEqualsToken,
              ts.createNumericLiteral("200")
            ),
            ts.createBinary(
              RESPONSE_STATUS_CODE,
              ts.SyntaxKind.LessThanToken,
              ts.createNumericLiteral("300")
            )
          ),
          ts.createBlock(
            [
              validateStatement(
                RESPONSE_DATA,
                validatorName(
                  endpointPropertyTypeName(endpointName, "response")
                ),
                `Invalid response for successful status code`
              ),
              ts.createReturn(
                ts.createObjectLiteral(
                  [
                    ts.createPropertyAssignment(
                      "kind",
                      ts.createStringLiteral("success")
                    ),
                    ts.createPropertyAssignment("data", RESPONSE_DATA)
                  ],
                  /*multiLine*/ true
                )
              )
            ],
            /*multiLine*/ true
          ),
          ts.createBlock(
            [
              validateStatement(
                RESPONSE_DATA,
                validatorName(
                  endpointPropertyTypeName(endpointName, "defaultError")
                ),
                `Invalid response for unknown error`
              ),
              ts.createReturn(
                ts.createObjectLiteral(
                  [
                    ts.createPropertyAssignment(
                      "kind",
                      ts.createStringLiteral("unknown-error")
                    ),
                    ts.createPropertyAssignment("data", RESPONSE_DATA)
                  ],
                  /*multiLine*/ true
                )
              )
            ],
            /*multiLine*/ true
          )
        )
      ])
    ])
  );
}

function validateStatement(
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
                ts.createTemplateHead(`${errorMessage}:`),
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
