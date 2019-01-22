import ts from "typescript";
import { isStringLiteral, ObjectLiteral } from "../literal-parser";
import { panic } from "../panic";

/**
 * Returns the description defined in the @endpoint() decorator.
 *
 * For example:
 * ```
 * @endpoint({
 *   method: "POST",
 *   path: "/users",
 *   description: "This is a description"
 * })
 * createUser(@request req: CreateUserRequest): CreateUserResponse {
 *   ...
 * }
 * ```
 *
 * will return "This is a description".
 */
export function extractEndpointDescription(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  endpointDescription: ObjectLiteral
): string {
  const descriptionLiteral = endpointDescription.properties["description"];
  let description = "";
  if (descriptionLiteral) {
    if (!isStringLiteral(descriptionLiteral)) {
      throw panic(
        `Invalid description in endpoint description: ${methodDeclaration.getText(
          sourceFile
        )}`
      );
    }
    description = descriptionLiteral.text;
  }
  return description;
}
