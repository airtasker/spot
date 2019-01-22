import ts from "typescript";
import { Endpoint } from "../../models";
import { extractSingleDecorator } from "../decorators";
import { isObjectLiteral } from "../literal-parser";
import { panic } from "../panic";
import { extractEndpointDescription } from "../properties/endpoint-description";
import { extractGenericErrorType } from "../properties/generic-error-type";
import { extractHeaders } from "../properties/headers";
import { extractMethod } from "../properties/method";
import { extractPath } from "../properties/path";
import { extractQueryParams } from "../properties/query-parameters";
import { extractRequestContentType } from "../properties/request-content-type";
import { extractRequestType } from "../properties/request-type";
import { extractResponseType } from "../properties/response-type";
import { extractSpecificErrorTypes } from "../properties/specific-error-type";
import { extractSuccessStatusCode } from "../properties/success-status-code";
import { extractTags } from "../properties/tags";

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
  methodDeclaration: ts.MethodDeclaration
): Endpoint {
  // A method must have an @endpoint() decorator to qualify as an endpoint definition.
  const endpointDecorator = extractSingleDecorator(
    sourceFile,
    methodDeclaration,
    "endpoint"
  );
  if (!endpointDecorator) {
    throw panic("Expected to have @endpoint() for the method");
  }

  if (endpointDecorator.arguments.length !== 1) {
    throw panic(
      `Expected exactly one argument for @endpoint(), got ${
        endpointDecorator.arguments.length
      }`
    );
  }
  // @endpoint() expects to be passed an object literal to define its method, path, etc.
  const endpointDescription = endpointDecorator.arguments[0];
  if (!isObjectLiteral(endpointDescription)) {
    throw panic(
      `@endpoint() expects an object literal, got this instead: ${methodDeclaration.getText(
        sourceFile
      )}`
    );
  }
  return {
    method: extractMethod(sourceFile, methodDeclaration, endpointDescription),
    path: extractPath(sourceFile, methodDeclaration, endpointDescription),
    description: extractEndpointDescription(
      sourceFile,
      methodDeclaration,
      endpointDescription
    ),
    requestContentType: extractRequestContentType(
      sourceFile,
      methodDeclaration,
      endpointDescription
    ),
    tags: extractTags(sourceFile, methodDeclaration, endpointDescription),
    headers: extractHeaders(sourceFile, methodDeclaration),
    queryParams: extractQueryParams(sourceFile, methodDeclaration),
    requestType: extractRequestType(sourceFile, methodDeclaration.parameters),
    responseType: extractResponseType(sourceFile, methodDeclaration),
    genericErrorType: extractGenericErrorType(sourceFile, methodDeclaration),
    specificErrorTypes: extractSpecificErrorTypes(
      sourceFile,
      methodDeclaration
    ),
    ...extractSuccessStatusCode(
      sourceFile,
      methodDeclaration,
      endpointDescription
    )
  };
}
