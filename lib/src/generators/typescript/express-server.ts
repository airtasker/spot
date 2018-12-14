import * as ts from "typescript";
import {
  Api,
  Endpoint,
  gatherTypes,
  NUMBER,
  objectType,
  optionalType,
  STRING,
  stringConstant,
  unionType,
  VOID
} from "../../models";
import { isVoid } from "../../validator";
import { outputTypeScriptSource } from "./ts-writer";
import { promiseTypeNode, typeNode } from "./types";
import {
  endpointPropertyTypeName,
  validateStatement,
  validatorName
} from "./validators";
import uniq = require("lodash/uniq");
import compact = require("lodash/compact");
import flatten = require("lodash/flatten");

const IMPORTED_CORS_NAME = "cors";
const IMPORTED_EXPRESS_NAME = "express";
const EXPRESS_APP_NAME = "app";
const PORT_NAME = "PORT";

export function generateExpressServerSource(api: Api): string {
  return outputTypeScriptSource([
    ts.createImportDeclaration(
      /*decorators*/ undefined,
      /*modifiers*/ undefined,
      ts.createImportClause(
        /*name*/ undefined,
        ts.createNamespaceImport(ts.createIdentifier(IMPORTED_CORS_NAME))
      ),
      ts.createStringLiteral("cors")
    ),
    ts.createImportDeclaration(
      /*decorators*/ undefined,
      /*modifiers*/ undefined,
      ts.createImportClause(
        /*name*/ undefined,
        ts.createNamespaceImport(ts.createIdentifier(IMPORTED_EXPRESS_NAME))
      ),
      ts.createStringLiteral("express")
    ),
    ts.createImportDeclaration(
      /*decorators*/ undefined,
      /*modifiers*/ undefined,
      ts.createImportClause(
        /*name*/ undefined,
        ts.createNamespaceImport(ts.createIdentifier("validators"))
      ),
      ts.createStringLiteral("./validators")
    ),
    ...Object.keys(api.endpoints).map(endpointName =>
      ts.createImportDeclaration(
        /*decorators*/ undefined,
        /*modifiers*/ undefined,
        ts.createImportClause(
          /*name*/ undefined,
          ts.createNamedImports([
            ts.createImportSpecifier(
              /*propertyName*/ undefined,
              ts.createIdentifier(endpointName)
            )
          ])
        ),
        ts.createStringLiteral(`./endpoints/${endpointName}`)
      )
    ),
    ts.createVariableStatement(
      /*modifiers*/ undefined,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            PORT_NAME,
            /*type*/ undefined,
            ts.createNumericLiteral("3020")
          )
        ],
        ts.NodeFlags.Const
      )
    ),
    ts.createVariableStatement(
      /*modifiers*/ undefined,
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            EXPRESS_APP_NAME,
            /*type*/ undefined,
            ts.createCall(
              ts.createIdentifier(IMPORTED_EXPRESS_NAME),
              /*typeArguments*/ undefined,
              []
            )
          )
        ],
        ts.NodeFlags.Const
      )
    ),
    ts.createStatement(
      ts.createCall(
        ts.createPropertyAccess(ts.createIdentifier(EXPRESS_APP_NAME), "use"),
        /*typeArguments*/ undefined,
        [
          ts.createCall(
            ts.createIdentifier(IMPORTED_CORS_NAME),
            /*typeArguments*/ undefined,
            []
          )
        ]
      )
    ),
    ts.createStatement(
      ts.createCall(
        ts.createPropertyAccess(ts.createIdentifier(EXPRESS_APP_NAME), "use"),
        /*typeArguments*/ undefined,
        [
          ts.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier(IMPORTED_EXPRESS_NAME),
              "json"
            ),
            /*typeArguments*/ undefined,
            []
          )
        ]
      )
    ),
    ...Object.entries(api.endpoints).map(([endpointName, endpoint]) =>
      generateEndpointRoute(api, endpointName, endpoint)
    ),
    ts.createStatement(
      ts.createCall(
        ts.createPropertyAccess(
          ts.createIdentifier(EXPRESS_APP_NAME),
          "listen"
        ),
        /*typeArguments*/ undefined,
        [
          ts.createIdentifier(PORT_NAME),
          ts.createArrowFunction(
            /*modifiers*/ undefined,
            /*typeParameters*/ undefined,
            [],
            /*type*/ undefined,
            /*equalsGreaterThanToken*/ undefined,
            ts.createBlock(
              [
                ts.createStatement(
                  ts.createCall(
                    ts.createPropertyAccess(
                      ts.createIdentifier("console"),
                      "log"
                    ),
                    /*typeArguments*/ undefined,
                    [
                      ts.createTemplateExpression(
                        ts.createTemplateHead("Listening on port "),
                        [
                          ts.createTemplateSpan(
                            ts.createIdentifier(PORT_NAME),
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
          )
        ]
      )
    )
  ]);
}

const DEFAULT_SUCCESS_STATUS = 200;
const DEFAULT_ERROR_STATUS = 500;
const REQUEST_PARAMETER = "req";
const RESPONSE_PARAMETER = "res";
const PARSED_REQUEST_VARIABLE = "request";
const RESPONSE_VARIABLE = "response";

function generateEndpointRoute(
  api: Api,
  endpointName: string,
  endpoint: Endpoint
): ts.Statement {
  const includeRequest = !isVoid(api, endpoint.requestType);
  return ts.createStatement(
    ts.createCall(
      ts.createPropertyAccess(
        ts.createIdentifier(EXPRESS_APP_NAME),
        endpoint.method.toLowerCase()
      ),
      /*typeArguments*/ undefined,
      [
        ts.createStringLiteral(
          endpoint.path
            .map(
              pathComponent =>
                pathComponent.kind === "static"
                  ? pathComponent.content
                  : `:${pathComponent.name}`
            )
            .join("")
        ),
        ts.createArrowFunction(
          [ts.createToken(ts.SyntaxKind.AsyncKeyword)],
          /*typeParameters*/ undefined,
          [
            ts.createParameter(
              /*decorators*/ undefined,
              /*modifiers*/ undefined,
              /*dotDotDotToken*/ undefined,
              REQUEST_PARAMETER
            ),
            ts.createParameter(
              /*decorators*/ undefined,
              /*modifiers*/ undefined,
              /*dotDotDotToken*/ undefined,
              RESPONSE_PARAMETER
            )
          ],
          /*type*/ undefined,
          /*equalsGreaterThanToken*/ undefined,
          ts.createBlock(
            [
              ...(includeRequest
                ? [
                    ts.createVariableStatement(
                      /*modifiers*/ undefined,
                      ts.createVariableDeclarationList(
                        [
                          ts.createVariableDeclaration(
                            PARSED_REQUEST_VARIABLE,
                            /*type*/ undefined,
                            ts.createPropertyAccess(
                              ts.createIdentifier(REQUEST_PARAMETER),
                              "body"
                            )
                          )
                        ],
                        ts.NodeFlags.Const
                      )
                    ),
                    validateStatement(
                      ts.createIdentifier(PARSED_REQUEST_VARIABLE),
                      validatorName(
                        endpointPropertyTypeName(endpointName, "request")
                      ),
                      "Invalid request"
                    )
                  ]
                : []),
              ...flatten(
                compact(
                  endpoint.path.map(
                    pathComponent =>
                      pathComponent.kind === "dynamic"
                        ? [
                            ts.createVariableStatement(
                              /*modifiers*/ undefined,
                              ts.createVariableDeclarationList(
                                [
                                  ts.createVariableDeclaration(
                                    pathComponent.name,
                                    /*type*/ undefined,
                                    ts.createPropertyAccess(
                                      ts.createPropertyAccess(
                                        ts.createIdentifier(REQUEST_PARAMETER),
                                        "params"
                                      ),
                                      pathComponent.name
                                    )
                                  )
                                ],
                                ts.NodeFlags.Const
                              )
                            ),
                            validateStatement(
                              ts.createIdentifier(pathComponent.name),
                              validatorName(
                                endpointPropertyTypeName(
                                  endpointName,
                                  "param",
                                  pathComponent.name
                                )
                              ),
                              `Invalid path parameter ${pathComponent.name}`
                            )
                          ]
                        : null
                  )
                )
              ),
              ...flatten(
                Object.entries(endpoint.headers).map(([headerName, header]) => [
                  ts.createVariableStatement(
                    /*modifiers*/ undefined,
                    ts.createVariableDeclarationList(
                      [
                        ts.createVariableDeclaration(
                          headerName,
                          /*type*/ undefined,
                          ts.createElementAccess(
                            ts.createPropertyAccess(
                              ts.createIdentifier(REQUEST_PARAMETER),
                              "headers"
                            ),
                            ts.createStringLiteral(header.headerFieldName)
                          )
                        )
                      ],
                      ts.NodeFlags.Const
                    )
                  ),
                  validateStatement(
                    ts.createIdentifier(headerName),
                    validatorName(
                      endpointPropertyTypeName(
                        endpointName,
                        "header",
                        headerName
                      )
                    ),
                    `Invalid header ${header.headerFieldName}`
                  )
                ])
              ),
              ts.createTry(
                ts.createBlock(
                  [
                    ts.createVariableStatement(
                      /*modifiers*/ undefined,
                      ts.createVariableDeclarationList(
                        [
                          ts.createVariableDeclaration(
                            RESPONSE_VARIABLE,
                            /*type*/ undefined,
                            ts.createAwait(
                              ts.createCall(
                                ts.createIdentifier(endpointName),
                                /*typeArguments*/ undefined,
                                [
                                  ...(isVoid(api, endpoint.requestType)
                                    ? []
                                    : [
                                        ts.createIdentifier(
                                          PARSED_REQUEST_VARIABLE
                                        )
                                      ]),
                                  ...compact(
                                    endpoint.path.map(
                                      pathComponent =>
                                        pathComponent.kind === "dynamic"
                                          ? ts.createIdentifier(
                                              pathComponent.name
                                            )
                                          : null
                                    )
                                  ),
                                  ...Object.keys(endpoint.headers).map(
                                    headerName =>
                                      ts.createIdentifier(headerName)
                                  )
                                ]
                              )
                            )
                          )
                        ],
                        ts.NodeFlags.Const
                      )
                    ),
                    ...generateValidateAndSendResponse(
                      api,
                      endpointName,
                      endpoint
                    )
                  ],
                  /*multiLine*/ true
                ),
                ts.createCatchClause(
                  "e",
                  ts.createBlock(
                    [
                      ts.createStatement(
                        ts.createCall(
                          ts.createPropertyAccess(
                            ts.createIdentifier("console"),
                            "error"
                          ),
                          /*typeArguments*/ undefined,
                          [
                            ts.createStringLiteral(
                              `Endpoint ${endpointName} threw an unexpected error:\n`
                            ),
                            ts.createIdentifier("e")
                          ]
                        )
                      ),
                      ts.createStatement(
                        ts.createCall(
                          ts.createPropertyAccess(
                            ts.createIdentifier(RESPONSE_PARAMETER),
                            "status"
                          ),
                          /*typeArguments*/ undefined,
                          [ts.createNumericLiteral("500")]
                        )
                      ),
                      ts.createStatement(
                        ts.createCall(
                          ts.createPropertyAccess(
                            ts.createIdentifier(RESPONSE_PARAMETER),
                            "json"
                          ),
                          /*typeArguments*/ undefined,
                          [
                            ts.createStringLiteral(
                              "An unknown server error has occurred."
                            )
                          ]
                        )
                      )
                    ],
                    /*multiLine*/ true
                  )
                ),
                /*finally*/ undefined
              )
            ],
            /*multiLine*/ true
          )
        )
      ]
    )
  );
}

function generateValidateAndSendResponse(
  api: Api,
  endpointName: string,
  endpoint: Endpoint
): ts.Statement[] {
  const response = ts.createIdentifier(RESPONSE_VARIABLE);
  const specificErrorKind = ts.createPropertyAccess(response, "error");
  const status = ts.createPropertyAccess(response, "status");
  const data = ts.createPropertyAccess(response, "data");
  const sendFixedStatus = (fixedStatusCode: number) =>
    ts.createStatement(
      ts.createCall(
        ts.createPropertyAccess(
          ts.createIdentifier(RESPONSE_PARAMETER),
          "status"
        ),
        /*typeArguments*/ undefined,
        [ts.createNumericLiteral(fixedStatusCode.toString(10))]
      )
    );
  const sendResponseStatus = (defaultStatusCode: number) =>
    ts.createStatement(
      ts.createCall(
        ts.createPropertyAccess(
          ts.createIdentifier(RESPONSE_PARAMETER),
          "status"
        ),
        /*typeArguments*/ undefined,
        [
          ts.createBinary(
            status,
            ts.SyntaxKind.BarBarToken,
            ts.createNumericLiteral(defaultStatusCode.toString(10))
          )
        ]
      )
    );
  const sendData = ts.createStatement(
    ts.createCall(
      ts.createPropertyAccess(ts.createIdentifier(RESPONSE_PARAMETER), "json"),
      /*typeArguments*/ undefined,
      [data]
    )
  );
  const sendNothing = ts.createStatement(
    ts.createCall(
      ts.createPropertyAccess(ts.createIdentifier(RESPONSE_PARAMETER), "end"),
      /*typeArguments*/ undefined,
      []
    )
  );
  return [
    ...Object.entries(endpoint.specificErrorTypes).map(
      ([name, specificError]) =>
        ts.createIf(
          ts.createStrictEquality(
            specificErrorKind,
            ts.createStringLiteral(name)
          ),
          ts.createBlock(
            [
              ...(isVoid(api, specificError.type)
                ? [sendFixedStatus(specificError.statusCode), sendNothing]
                : [
                    validateStatement(
                      data,
                      validatorName(
                        endpointPropertyTypeName(
                          endpointName,
                          "specificError",
                          name
                        )
                      ),
                      `Invalid error response for specific error ${name}`
                    ),
                    sendFixedStatus(specificError.statusCode),
                    sendData
                  ]),
              ts.createReturn()
            ],
            /*multiLine*/ true
          )
        )
    ),
    ts.createIf(
      ts.createBinary(
        ts.createStringLiteral("error"),
        ts.SyntaxKind.InKeyword,
        ts.createIdentifier(RESPONSE_VARIABLE)
      ),
      ts.createBlock(
        isVoid(api, endpoint.genericErrorType)
          ? [sendResponseStatus(DEFAULT_ERROR_STATUS), sendNothing]
          : [
              validateStatement(
                data,
                validatorName(
                  endpointPropertyTypeName(endpointName, "genericError")
                ),
                "Invalid error response"
              ),
              sendResponseStatus(DEFAULT_ERROR_STATUS),
              sendData
            ],
        /*multiLine*/ true
      ),
      ts.createBlock(
        isVoid(api, endpoint.responseType)
          ? [sendResponseStatus(DEFAULT_SUCCESS_STATUS), sendNothing]
          : [
              validateStatement(
                data,
                validatorName(
                  endpointPropertyTypeName(endpointName, "response")
                ),
                "Invalid successful response"
              ),
              sendResponseStatus(DEFAULT_SUCCESS_STATUS),
              sendData
            ],
        /*multiLine*/ true
      )
    )
  ];
}

export function generateEndpointHandlerSource(
  api: Api,
  endpointName: string,
  endpoint: Endpoint
): string {
  const typeNames = getTypeNamesForEndpoint(endpoint);
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
            ts.createStringLiteral("../types")
          )
        ]
      : []),
    ts.createFunctionDeclaration(
      /*decorators*/ undefined,
      [
        ts.createToken(ts.SyntaxKind.ExportKeyword),
        ts.createToken(ts.SyntaxKind.AsyncKeyword)
      ],
      /*asteriskToken*/ undefined,
      endpointName,
      /*typeParameters*/ undefined,
      [
        ...(isVoid(api, endpoint.requestType)
          ? []
          : [
              ts.createParameter(
                /*decorators*/ undefined,
                /*modifiers*/ undefined,
                /*dotDotDotToken*/ undefined,
                ts.createIdentifier("request"),
                /*questionToken*/ undefined,
                typeNode(api.types, endpoint.requestType)
              )
            ]),
        ...compact(
          endpoint.path.map(
            pathComponent =>
              pathComponent.kind === "dynamic"
                ? ts.createParameter(
                    /*decorators*/ undefined,
                    /*modifiers*/ undefined,
                    /*dotDotDotToken*/ undefined,
                    ts.createIdentifier(pathComponent.name),
                    /*questionToken*/ undefined,
                    typeNode(api.types, pathComponent.type)
                  )
                : null
          )
        ),
        ...Object.entries(endpoint.headers).map(([headerName, header]) =>
          ts.createParameter(
            /*decorators*/ undefined,
            /*modifiers*/ undefined,
            /*dotDotDotToken*/ undefined,
            ts.createIdentifier(headerName),
            /*questionToken*/ undefined,
            typeNode(api.types, header.type)
          )
        )
      ],
      promiseTypeNode(
        api.types,
        unionType(
          ...[
            objectType({
              error: VOID,
              status: NUMBER,
              data: endpoint.responseType
            }),
            ...Object.entries(endpoint.specificErrorTypes).map(
              ([name, specificError]) =>
                objectType({
                  error: stringConstant(name),
                  status: VOID,
                  data: specificError.type
                })
            ),
            objectType({
              error: STRING,
              status: optionalType(NUMBER),
              data: endpoint.genericErrorType
            })
          ]
        )
      ),
      ts.createBlock(
        [
          ts.createThrow(
            ts.createNew(
              ts.createIdentifier("Error"),
              /*typeArguments*/ undefined,
              [
                ts.createStringLiteral(
                  `Endpoint ${endpointName} is not yet implemented!`
                )
              ]
            )
          )
        ],
        /*multiLine*/ true
      )
    )
  ]);
}

function getTypeNamesForEndpoint(endpoint: Endpoint): string[] {
  return uniq(
    compact(
      gatherTypes(endpoint).map(
        t => (t.kind === "type-reference" ? t.typeName : null)
      )
    )
  );
}
