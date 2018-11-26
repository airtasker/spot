import * as ts from "typescript";
import { isNumericLiteral, ObjectLiteral } from "../literal-parser";
import { panic } from "../panic";

/**
 * Returns the request content type of an endpoint.
 *
 * For example:
 * ```
 * @endpoint({
 *   method: "POST",
 *   path: "/users",
 *   successStatusCode: 201,
 * })
 * createUser(@request req: CreateUserRequest): CreateUserResponse {
 *   ...
 * }
 * ```
 *
 * will return { successStatusCode: 201 }.
 *
 * The status code will be omitted when not defined explicitly.
 */
export function extractSuccessStatusCode(
  sourceFile: ts.SourceFile,
  endpointDescriptionExpression: ts.Expression,
  endpointDescription: ObjectLiteral
): {
  successStatusCode?: number;
} {
  const successStatusCodeLiteral =
    endpointDescription.properties["successStatusCode"];
  if (!successStatusCodeLiteral) {
    return {};
  }
  if (!isNumericLiteral(successStatusCodeLiteral)) {
    throw panic(
      `Invalid success status code in endpoint description: ${endpointDescriptionExpression.getText(
        sourceFile
      )}`
    );
  }
  let successStatusCode = parseInt(successStatusCodeLiteral.text);
  return { successStatusCode };
}
