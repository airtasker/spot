import ts from "typescript";
import {
  isArrayLiteral,
  isStringLiteral,
  ObjectLiteral
} from "../literal-parser";
import { panic } from "../panic";

/**
 * Returns the tags defined in the @endpoint() decorator.
 *
 * For example:
 * ```
 * @endpoint({
 *   method: "POST",
 *   path: "/users",
 *   tags: ["users"]
 * })
 * createUser(@request req: CreateUserRequest): CreateUserResponse {
 *   ...
 * }
 * ```
 *
 * will return ["users"].
 */
export function extractTags(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  endpointDescription: ObjectLiteral
): string[] {
  const tagsLiteral = endpointDescription.properties["tags"];
  if (tagsLiteral) {
    if (!isArrayLiteral(tagsLiteral)) {
      throw panic(
        `Invalid tags in endpoint description: ${methodDeclaration.getText(
          sourceFile
        )}`
      );
    }
    return tagsLiteral.elements.map(tagLiteral => {
      if (!isStringLiteral(tagLiteral)) {
        throw panic(
          `Invalid tag in endpoint description: ${methodDeclaration.getText(
            sourceFile
          )}`
        );
      }
      return tagLiteral.text;
    });
  }
  return [];
}
