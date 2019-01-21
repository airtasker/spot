import ts from "typescript";
import { Headers } from "../../models";
import { extractSingleDecorator } from "../decorators";
import { isObjectLiteral, isStringLiteral } from "../literal-parser";
import { panic } from "../panic";
import { extractParameterType } from "./parameter-type";

/**
 * Returns a dictionary of headers, including their type and description.
 *
 * For example:
 * ```
 * @endpoint({ ... })
 * myEndpoint(@header({ name: "Authorization" }) auth: string) {
 *   ...
 * }
 * ```
 *
 * will return a dictionary containing a single Header of type string with an empty
 * description.
 *
 * Note that the only types allowed are string and Optional<string>.
 */
export function extractHeaders(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration
): Headers {
  const headers: Headers = {};
  for (const parameter of methodDeclaration.parameters) {
    processHeaderParameter(sourceFile, methodDeclaration, parameter, headers);
  }
  return headers;
}

function processHeaderParameter(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  parameter: ts.ParameterDeclaration,
  headers: Headers
) {
  const headerDecorator = extractSingleDecorator(
    sourceFile,
    parameter,
    "header"
  );
  if (!headerDecorator) {
    return;
  }
  const name = parameter.name.getText(sourceFile);
  if (headers[name]) {
    throw panic(`Found multiple headers named ${name}`);
  }
  if (headerDecorator.arguments.length !== 1) {
    throw panic(
      `Expected exactly one argument for @header(), got ${
        headerDecorator.arguments.length
      }`
    );
  }
  const headerDescription = headerDecorator.arguments[0];
  if (!isObjectLiteral(headerDescription)) {
    throw panic(
      `@header() expects an object literal, got this instead: ${methodDeclaration.getText(
        sourceFile
      )}`
    );
  }
  const nameProperty = headerDescription.properties["name"];
  if (!nameProperty || !isStringLiteral(nameProperty)) {
    throw panic(
      `@header() expects a string name, got this instead: ${methodDeclaration.getText(
        sourceFile
      )}`
    );
  }
  const descriptionProperty = headerDescription.properties["description"];
  let description = "";
  if (descriptionProperty) {
    if (!isStringLiteral(descriptionProperty)) {
      throw panic(
        `@header() expects a string description, got this instead: ${methodDeclaration.getText(
          sourceFile
        )}`
      );
    }
    description = descriptionProperty.text;
  }
  headers[name] = {
    headerFieldName: nameProperty.text,
    description,
    type: extractParameterType(sourceFile, parameter)
  };
}
