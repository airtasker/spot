import ts from "typescript";
import { HttpMethod, isHttpMethod } from "../../lib";
import { isStringLiteral, ObjectLiteral } from "../literal-parser";
import { panic } from "../panic";

/**
 * Returns the HTTP method defined in the @endpoint() decorator.
 *
 * For example:
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
 * will return "POST".
 */
export function extractMethod(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  endpointDescription: ObjectLiteral
): HttpMethod {
  const methodLiteral = endpointDescription.properties["method"];
  if (!isStringLiteral(methodLiteral)) {
    throw panic(
      `Invalid method in endpoint description: ${methodDeclaration.getText(
        sourceFile
      )}`
    );
  }
  const method = methodLiteral.text;
  if (!isHttpMethod(method)) {
    throw panic(`${method} is not a valid HTTP method`);
  }
  return method;
}
