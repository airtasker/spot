import * as ts from "typescript";
import assertNever from "../../assert-never";
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
import { isVoid } from "../../validator";
import { outputTypeScriptSource } from "./ts-writer";
import { promiseTypeNode, typeNode } from "./types";
import {
  endpointPropertyTypeName,
  validateStatement,
  validatorName
} from "./validators";
import compact = require("lodash/compact");

const IMPORTED_AXIOS_NAME = "axios";

export function generateAxiosClientSource(api: Api): string {
  const typeNames = Object.keys(api.types);
  return outputTypeScriptSource([
    ts.createImportDeclaration(
      /*decorators*/ undefined,
      /*modifiers*/ undefined,
      ts.createImportClause(
        ts.createIdentifier(IMPORTED_AXIOS_NAME),
        /*namedBindings*/ undefined
      ),
      ts.createStringLiteral("axios")
    ),
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
    ts.createImportDeclaration(
      /*decorators*/ undefined,
      /*modifiers*/ undefined,
      ts.createImportClause(
        /*name*/ undefined,
        ts.createNamespaceImport(ts.createIdentifier("validators"))
      ),
      ts.createStringLiteral("./validators")
    ),
    ...Object.entries(api.endpoints).map(([endpointName, endpoint]) =>
      generateEndpointFunction(api, endpointName, endpoint)
    )
  ]);
}

const REQUEST_PARAMETER = "request";

function generateEndpointFunction(
  api: Api,
  endpointName: string,
  endpoint: Endpoint
): ts.FunctionDeclaration {
  const includeRequest = !isVoid(api, endpoint.requestType);
  return ts.createFunctionDeclaration(
    /*decorators*/ undefined,
    [
      ts.createToken(ts.SyntaxKind.ExportKeyword),
      ts.createToken(ts.SyntaxKind.AsyncKeyword)
    ],
    /*asteriskToken*/ undefined,
    endpointName,
    /*typeParameters*/ undefined,
    [
      ...(includeRequest
        ? [
            ts.createParameter(
              /*decorators*/ undefined,
              /*modifiers*/ undefined,
              /*dotDotDotToken*/ undefined,
              REQUEST_PARAMETER,
              /*questionToken*/ undefined,
              typeNode(endpoint.requestType)
            )
          ]
        : []),
      ...compact(
        endpoint.path.map(
          pathComponent =>
            pathComponent.kind === "dynamic"
              ? ts.createParameter(
                  /*decorators*/ undefined,
                  /*modifiers*/ undefined,
                  /*dotDotDotToken*/ undefined,
                  pathComponent.name,
                  /*questionToken*/ undefined,
                  typeNode(pathComponent.type)
                )
              : null
        )
      ),
      ...Object.entries(endpoint.headers).map(([headerName, header]) =>
        ts.createParameter(
          /*decorators*/ undefined,
          /*modifiers*/ undefined,
          /*dotDotDotToken*/ undefined,
          headerName,
          /*questionToken*/ undefined,
          typeNode(header.type)
        )
      ),
      ...endpoint.queryParams.map(queryParam =>
        ts.createParameter(
          /*decorators*/ undefined,
          /*modifiers*/ undefined,
          /*dotDotDotToken*/ undefined,
          queryParam.name,
          /*questionToken*/ undefined,
          typeNode(queryParam.type)
        )
      )
    ],
    promiseTypeNode(unionType(...generateReturnTypes(endpoint))),
    generateEndpointBody(endpointName, endpoint, includeRequest)
  );
}

function generateReturnTypes(endpoint: Endpoint): Type[] {
  return [
    objectType({
      kind: stringConstant("success"),
      data: endpoint.responseType
    }),
    objectType({
      kind: stringConstant("unknown-error"),
      data: endpoint.genericErrorType
    }),
    ...Object.entries(endpoint.specificErrorTypes).map(
      ([name, specificError]) =>
        objectType({
          kind: stringConstant(name),
          data: specificError.type
        })
    )
  ];
}

function generateEndpointBody(
  endpointName: string,
  endpoint: Endpoint,
  includeRequest: boolean
): ts.FunctionBody {
  return ts.createBlock(
    [
      ...(includeRequest
        ? [generateRequestValidation(endpointName, endpoint)]
        : []),
      ...compact(
        endpoint.path.map(
          pathComponent =>
            pathComponent.kind === "dynamic"
              ? generatePathParameterValidation(endpointName, pathComponent)
              : null
        )
      ),
      ...Object.keys(endpoint.headers).map(headerName =>
        generateHeaderValidation(endpointName, headerName)
      ),
      generateAxiosCall(endpoint, includeRequest),
      generateSwitchStatus(endpointName, endpoint)
    ],
    /*multiLine*/ true
  );
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
      ...Object.entries(endpoint.specificErrorTypes).map(
        ([name, specificError]) =>
          ts.createCaseClause(
            ts.createNumericLiteral(specificError.statusCode.toString(10)),
            [
              validateStatement(
                RESPONSE_DATA,
                validatorName(
                  endpointPropertyTypeName(endpointName, "specificError", name)
                ),
                `Invalid response for status code ${specificError.statusCode}`
              ),
              ts.createReturn(
                ts.createObjectLiteral(
                  [
                    ts.createPropertyAssignment(
                      "kind",
                      ts.createStringLiteral(name)
                    ),
                    ts.createPropertyAssignment("data", RESPONSE_DATA)
                  ],
                  /*multiLine*/ true
                )
              )
            ]
          )
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
                  endpointPropertyTypeName(endpointName, "genericError")
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
