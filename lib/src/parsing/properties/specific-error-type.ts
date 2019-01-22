import ts from "typescript";
import { SpecificError } from "../../models";
import { Decorator, extractMultipleDecorators } from "../decorators";
import {
  isNumericLiteral,
  isObjectLiteral,
  isStringLiteral,
  Literal
} from "../literal-parser";
import { panic } from "../panic";

/**
 * Returns the list of specific errors attached to an endpoint.
 *
 * For example:
 * ```
 * @specificError<ForbiddenError>({
 *   name: "forbidden",
 *   status: 403,
 * })
 * myEndpoint() {
 *   ...
 * }
 * ```
 *
 * will return a dictionary containing a single SpecificError of type ForbiddenError with
 * the status code 403.
 */
export function extractSpecificErrorTypes(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration
): { [name: string]: SpecificError } {
  const specificErrorDecorators = extractMultipleDecorators(
    sourceFile,
    methodDeclaration,
    "specificError"
  );
  let specificErrorTypes: {
    [name: string]: SpecificError;
  } = {};
  for (const specificErrorDecorator of specificErrorDecorators) {
    const [name, specificError] = extractSpecificError(
      sourceFile,
      methodDeclaration,
      specificErrorDecorator
    );
    specificErrorTypes[name] = specificError;
  }
  return specificErrorTypes;
}

function extractSpecificError(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  specificErrorDecorator: Decorator
): [string /*name */, SpecificError] {
  if (specificErrorDecorator.typeParameters.length !== 1) {
    throw panic(
      `Expected exactly one type parameter for @specificError(), got ${
        specificErrorDecorator.typeParameters.length
      }`
    );
  }
  const errorResponseType = specificErrorDecorator.typeParameters[0];
  if (specificErrorDecorator.arguments.length !== 1) {
    throw panic(
      `Expected exactly one argument for @specificError(), got ${
        specificErrorDecorator.arguments.length
      }`
    );
  }
  let errorDescription: Literal;
  if (specificErrorDecorator.arguments.length === 1) {
    errorDescription = specificErrorDecorator.arguments[0];
    if (!isObjectLiteral(errorDescription)) {
      throw panic(
        `@specificError() expects an object literal, got this instead: ${methodDeclaration.getText(
          sourceFile
        )}`
      );
    }
  } else {
    errorDescription = {
      kind: "object",
      properties: {}
    };
  }
  const name = errorDescription.properties["name"];
  if (!name || !isStringLiteral(name)) {
    throw panic(
      `@specificError() expects a string name, got this instead: ${methodDeclaration.getText(
        sourceFile
      )}`
    );
  }
  const statusCode = errorDescription.properties["statusCode"];
  if (!statusCode || !isNumericLiteral(statusCode)) {
    throw panic(
      `@specificError() expects a numeric status code, got this instead: ${methodDeclaration.getText(
        sourceFile
      )}`
    );
  }
  return [
    name.text,
    {
      // TODO: Ensure that the status is an integer.
      statusCode: parseInt(statusCode.text),
      type: errorResponseType
    }
  ];
}
