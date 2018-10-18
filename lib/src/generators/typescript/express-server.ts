import * as ts from "typescript";
import { Api, Endpoint } from "../../models";
import { outputTypeScriptSource } from "./ts-writer";
import {
  endpointPropertyTypeName,
  validateStatement,
  validatorName
} from "./validators";
import compact = require("lodash/compact");
import flatten = require("lodash/flatten");

const IMPORTED_CORS_NAME = "cors";
const IMPORTED_EXPRESS_NAME = "express";
const EXPRESS_APP_NAME = "app";

export function generateExpressServerSource(api: Api): string {
  const statements: ts.Statement[] = [];
  statements.push(
    ts.createImportDeclaration(
      /*decorators*/ undefined,
      /*modifiers*/ undefined,
      ts.createImportClause(
        /*name*/ undefined,
        ts.createNamespaceImport(ts.createIdentifier(IMPORTED_CORS_NAME))
      ),
      ts.createStringLiteral("cors")
    )
  );
  statements.push(
    ts.createImportDeclaration(
      /*decorators*/ undefined,
      /*modifiers*/ undefined,
      ts.createImportClause(
        /*name*/ undefined,
        ts.createNamespaceImport(ts.createIdentifier(IMPORTED_EXPRESS_NAME))
      ),
      ts.createStringLiteral("express")
    )
  );
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
  statements.push(
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
    )
  );
  statements.push(
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
    )
  );
  statements.push(
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
    )
  );
  for (const [endpointName, endpoint] of Object.entries(api.endpoints)) {
    statements.push(generateEndpointRoute(endpointName, endpoint));
  }
  return outputTypeScriptSource(statements);
}

const REQUEST_PARAMETER = "req";
const RESPONSE_PARAMETER = "res";
const PARSED_REQUEST_VARIABLE = "request";
const RESPONSE_VARIABLE = "response";

function generateEndpointRoute(
  endpointName: string,
  endpoint: Endpoint
): ts.Statement {
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
              ),
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
                            ...(endpoint.requestType.kind !== "void"
                              ? [ts.createIdentifier(PARSED_REQUEST_VARIABLE)]
                              : []),
                            ...compact(
                              endpoint.path.map(
                                pathComponent =>
                                  pathComponent.kind === "dynamic"
                                    ? ts.createIdentifier(pathComponent.name)
                                    : null
                              )
                            ),
                            ...Object.keys(endpoint.headers).map(headerName =>
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
              ...generateValidateAndSendResponse(endpointName, endpoint)
            ],
            /*multiLine*/ true
          )
        )
      ]
    )
  );
}

function generateValidateAndSendResponse(
  endpointName: string,
  endpoint: Endpoint
): ts.Statement[] {
  const response = ts.createIdentifier(RESPONSE_VARIABLE);
  const status = ts.createPropertyAccess(response, "status");
  const data = ts.createPropertyAccess(response, "data");
  const sendStatusAndData = [
    ts.createStatement(
      ts.createCall(
        ts.createPropertyAccess(
          ts.createIdentifier(RESPONSE_PARAMETER),
          "status"
        ),
        /*typeArguments*/ undefined,
        [status]
      )
    ),
    ts.createStatement(
      ts.createCall(
        ts.createPropertyAccess(
          ts.createIdentifier(RESPONSE_PARAMETER),
          "json"
        ),
        /*typeArguments*/ undefined,
        [data]
      )
    )
  ];
  return [
    ...Object.keys(endpoint.customErrorTypes).map(statusCode =>
      ts.createIf(
        ts.createStrictEquality(status, ts.createNumericLiteral(statusCode)),
        ts.createBlock(
          [
            validateStatement(
              data,
              validatorName(
                endpointPropertyTypeName(
                  endpointName,
                  "customError",
                  statusCode
                )
              ),
              `Invalid error response for status ${statusCode}`
            ),
            ...sendStatusAndData,
            ts.createReturn()
          ],
          /*multiLine*/ true
        )
      )
    ),
    ts.createIf(
      ts.createLogicalAnd(
        ts.createBinary(
          status,
          ts.SyntaxKind.GreaterThanEqualsToken,
          ts.createNumericLiteral("200")
        ),
        ts.createBinary(
          status,
          ts.SyntaxKind.LessThanToken,
          ts.createNumericLiteral("300")
        )
      ),
      ts.createBlock(
        [
          validateStatement(
            data,
            validatorName(endpointPropertyTypeName(endpointName, "response")),
            "Invalid successful response"
          )
        ],
        /*multiLine*/ true
      ),
      validateStatement(
        data,
        validatorName(endpointPropertyTypeName(endpointName, "defaultError")),
        "Invalid error response"
      )
    ),
    ...sendStatusAndData
  ];
}
