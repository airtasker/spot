import ts from "typescript";
import { HttpContentType, isHttpContentType } from "../../lib";
import { isStringLiteral, ObjectLiteral } from "../literal-parser";
import { panic } from "../panic";

/**
 * Returns the request content type of an endpoint.
 *
 * For example:
 * ```
 * @endpoint({
 *   method: "POST",
 *   path: "/users",
 *   requestContentType: "application/json"
 * })
 * createUser(@request req: CreateUserRequest): CreateUserResponse {
 *   ...
 * }
 * ```
 *
 * will return "application/json".
 */
export function extractRequestContentType(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  endpointDescription: ObjectLiteral
): HttpContentType {
  const requestContentTypeLiteral =
    endpointDescription.properties["requestContentType"];
  let requestContentType = "application/json";
  if (requestContentTypeLiteral) {
    if (!isStringLiteral(requestContentTypeLiteral)) {
      throw panic(
        `Invalid request content type in endpoint description: ${methodDeclaration.getText(
          sourceFile
        )}`
      );
    }
    requestContentType = requestContentTypeLiteral.text;
  }
  if (!isHttpContentType(requestContentType)) {
    throw panic(`${requestContentType} is not a valid HTTP content type`);
  }
  return requestContentType;
}
