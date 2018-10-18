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
import { promiseTypeNode, typeNode } from "./types";
import {
  endpointPropertyTypeName,
  validateStatement,
  validatorName
} from "./validators";

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
  const includeRequest = endpoint.requestType.kind !== "void";
  if (includeRequest) {
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
  for (const [headerName, header] of Object.entries(endpoint.headers)) {
    parameters.push(
      ts.createParameter(
        /*decorators*/ undefined,
        /*modifiers*/ undefined,
        /*dotDotDotToken*/ undefined,
        headerName,
        /*questionToken*/ undefined,
        typeNode(header.type)
      )
    );
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
    promiseTypeNode(unionType(...generateReturnTypes(endpoint))),
    generateEndpointBody(endpointName, endpoint, includeRequest)
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
  endpoint: Endpoint,
  includeRequest: boolean
): ts.FunctionBody {
  const statements: ts.Statement[] = [];
  if (includeRequest) {
    statements.push(generateRequestValidation(endpointName, endpoint));
  }
  for (const pathComponent of endpoint.path) {
    if (pathComponent.kind === "dynamic") {
      statements.push(
        generatePathParameterValidation(endpointName, pathComponent)
      );
    }
  }
  for (const headerName of Object.keys(endpoint.headers)) {
    statements.push(generateHeaderValidation(endpointName, headerName));
  }
  statements.push(generateAxiosCall(endpoint, includeRequest));
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

function generateHeaderValidation(
  endpointName: string,
  headerName: string
): ts.Statement {
  return validateStatement(
    ts.createIdentifier(headerName),
    validatorName(endpointPropertyTypeName(endpointName, "header", headerName)),
    `Invalid parameter ${headerName}`
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
    `Invalid parameter ${pathComponent.name}`
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

function generateAxiosCall(
  endpoint: Endpoint,
  includeRequest: boolean
): ts.Statement {
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
                      "headers",
                      ts.createObjectLiteral(
                        Object.entries(endpoint.headers).map(
                          ([headerName, header]) =>
                            ts.createPropertyAssignment(
                              header.headerFieldName,
                              ts.createIdentifier(headerName)
                            )
                        )
                      )
                    ),
                    ...(includeRequest
                      ? [
                          ts.createPropertyAssignment(
                            "data",
                            ts.createIdentifier(REQUEST_PARAMETER)
                          )
                        ]
                      : []),
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
