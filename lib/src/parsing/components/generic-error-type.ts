import * as ts from "typescript";
import { Type, VOID } from "../../models";
import { extractSingleDecorator } from "../decorators";
import { panic } from "../panic";

/**
 * Returns the generic error type attached to an endpoint, or void otherwise.
 *
 * For example:
 * ```
 * @genericError<GenericError>()
 * myEndpoint() {
 *   ...
 * }
 * ```
 *
 * will return the type GenericError.
 */
export function extractGenericErrorType(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration
): Type {
  const genericErrorDecorator = extractSingleDecorator(
    sourceFile,
    methodDeclaration,
    "genericError"
  );
  if (genericErrorDecorator) {
    if (genericErrorDecorator.typeParameters.length !== 1) {
      throw panic(
        `Expected exactly one type parameter for @genericError(), got ${
          genericErrorDecorator.typeParameters.length
        }`
      );
    }
    return genericErrorDecorator.typeParameters[0];
  }
  return VOID;
}
