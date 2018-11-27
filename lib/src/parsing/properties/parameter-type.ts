import * as ts from "typescript";
import { Type } from "../../models";
import { panic } from "../panic";
import { extractType } from "../type-parser";

/**
 * Returns the type of a method parameter.
 *
 * This is used to get the type of request bodies, headers, query parameters and path parameters.
 */
export function extractParameterType(
  sourceFile: ts.SourceFile,
  parameter: ts.ParameterDeclaration
): Type {
  if (parameter.questionToken) {
    throw panic(
      `Question tokens are not allowed in parameter definitions. Please use Optional<...> to be specific. Offending parameter: ${parameter.getText(
        sourceFile
      )}`
    );
  }
  if (!ts.isIdentifier(parameter.name)) {
    throw panic(
      `Expected a plain identifier for endpoint parameter name, got this instead: ${parameter.getText(
        sourceFile
      )}`
    );
  }
  if (!parameter.type) {
    throw panic(
      `Expected a type for endpoint parameter: ${parameter.getText(sourceFile)}`
    );
  }
  return extractType(sourceFile, parameter.type);
}
