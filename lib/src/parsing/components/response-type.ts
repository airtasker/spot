import * as ts from "typescript";
import { VOID } from "../../models";
import { panic } from "../panic";
import { extractType } from "../type-parser";

/**
 * Returns the response type of an endpoint.
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
 * will return the type CreateUserResponse.
 */
export function extractResponseType(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration
) {
  if (!methodDeclaration.type) {
    return VOID;
  }
  // If the return type is Promise<type> because it was defined as an async method,
  // we'll ignore the promise and return the wrapped type.
  if (
    ts.isTypeReferenceNode(methodDeclaration.type) &&
    ts.isIdentifier(methodDeclaration.type.typeName) &&
    methodDeclaration.type.typeName.escapedText === "Promise"
  ) {
    if (
      !methodDeclaration.type.typeArguments ||
      methodDeclaration.type.typeArguments.length !== 1
    ) {
      throw panic(
        `Expected Promise<...>, got this instead: ${methodDeclaration.type.getText(
          sourceFile
        )}`
      );
    }
    const promisedType = methodDeclaration.type.typeArguments[0];
    return extractType(sourceFile, promisedType);
  } else {
    return extractType(sourceFile, methodDeclaration.type);
  }
}
