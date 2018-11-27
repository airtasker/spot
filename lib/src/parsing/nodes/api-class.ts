import * as ts from "typescript";
import { Api } from "../../models";
import { parseEndpointMethod } from "./endpoint-method";

/**
 * Parses a top-level API class definition and the endpoints it defines, such as:
 * ```
 * @api()
 * class Api {
 *   @endpoint({
 *     method: "POST",
 *     path: "/users"
 *   })
 *   createUser(@request req: CreateUserRequest): CreateUserResponse {
 *     ...
 *   }
 * }
 * ```
 */
export function parseApiClass(
  sourceFile: ts.SourceFile,
  classDeclaration: ts.ClassDeclaration,
  api: Api
): void {
  for (const member of classDeclaration.members) {
    if (ts.isMethodDeclaration(member)) {
      parseEndpointMethod(sourceFile, member, api);
    }
  }
}
