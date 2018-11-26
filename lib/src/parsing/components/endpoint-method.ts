import * as ts from "typescript";
import { Api, Endpoint } from "../../models";
import { extractSingleDecorator } from "../decorators";
import { extractLiteral, isObjectLiteral } from "../literal-parser";
import { panic } from "../panic";
import { extractGenericErrorType } from "./generic-error-type";
import { extractHeaders } from "./headers";
import { extractMethod } from "./method";
import { extractPath } from "./path";
import { extractQueryParams } from "./query-parameters";
import { extractRequestContentType } from "./request-content-type";
import { extractRequestType } from "./request-type";
import { extractResponseType } from "./response-type";
import { extractSpecificErrorTypes } from "./specific-error-type";
import { extractSuccessStatusCode } from "./success-status-code";

/**
 * Parses a method of an API class definition, such as:
 * ```
 * @endpoint({
 *   method: "POST",
 *   path: "/users"
 * })
 * createUser(@request req: CreateUserRequest): CreateUserResponse {
 *   ...
 * }
 * ```
 *
 * Methods that do not have an @endpoint() decorator will be ignored.
 */
export function parseEndpointMethod(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  api: Api
): void {
  // A method must have an @endpoint() decorator to qualify as an endpoint definition.
  const endpointDecorator = extractSingleDecorator(
    sourceFile,
    methodDeclaration,
    "endpoint"
  );
  if (!endpointDecorator) {
    return;
  }
  // Each endpoint must be defined only once.
  const endpointName = methodDeclaration.name.getText(sourceFile);
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
  // @endpoint() expects to be passed an object literal to define its method, path, etc.
  const endpointDescriptionExpression = endpointDecorator.arguments[0];
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
  const endpoint: Endpoint = {
    method: extractMethod(
      sourceFile,
      endpointDescriptionExpression,
      endpointDescription
    ),
    path: extractPath(
      sourceFile,
      methodDeclaration,
      endpointDescriptionExpression,
      endpointDescription
    ),
    requestContentType: extractRequestContentType(
      sourceFile,
      endpointDescriptionExpression,
      endpointDescription
    ),
    headers: extractHeaders(sourceFile, methodDeclaration.parameters),
    queryParams: extractQueryParams(sourceFile, methodDeclaration.parameters),
    requestType: extractRequestType(sourceFile, methodDeclaration.parameters),
    responseType: extractResponseType(sourceFile, methodDeclaration),
    genericErrorType: extractGenericErrorType(sourceFile, methodDeclaration),
    specificErrorTypes: extractSpecificErrorTypes(
      sourceFile,
      methodDeclaration
    ),
    ...extractSuccessStatusCode(
      sourceFile,
      endpointDescriptionExpression,
      endpointDescription
    )
  };
  api.endpoints[endpointName] = endpoint;
}
