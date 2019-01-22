import ts from "typescript";
import { Type, VOID } from "../../models";
import { extractSingleDecorator } from "../decorators";
import { panic } from "../panic";
import { extractParameterType } from "./parameter-type";

/**
 * Returns the request type of an endpoint.
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
 * will return the type CreateUserRequest.
 *
 * By default, the request type is void.
 */
export function extractRequestType(
  sourceFile: ts.SourceFile,
  parameters: ts.NodeArray<ts.ParameterDeclaration>
): Type {
  let requestType: Type = VOID;
  let foundRequestType = false;
  for (const parameter of parameters) {
    const requestDecorator = extractSingleDecorator(
      sourceFile,
      parameter,
      "request"
    );
    if (requestDecorator) {
      if (foundRequestType) {
        throw panic(`Found two @request parameters in a single endpoint.`);
      }
      requestType = extractParameterType(sourceFile, parameter);
      foundRequestType = true;
    }
  }
  return requestType;
}
