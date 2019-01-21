import ts from "typescript";
import { QueryParamComponent } from "../../models";
import { extractSingleDecorator } from "../decorators";
import { isObjectLiteral, isStringLiteral } from "../literal-parser";
import { panic } from "../panic";
import { extractParameterType } from "./parameter-type";

/**
 * Returns query parameters for an endpoint.
 *
 * For example:
 * ```
 * @endpoint({
 *   method: "GET",
 *   path: "/users"
 * })
 * getUser(@queryParam() sortBy: string): User[] {
 *   ...
 * }
 * ```
 *
 * will return a list of query parameters with a single item of name "sortBy"
 * and type string.
 */
export function extractQueryParams(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration
): QueryParamComponent[] {
  const queryParams: QueryParamComponent[] = [];
  const queryParamComponents: { [name: string]: QueryParamComponent } = {};
  for (const parameter of methodDeclaration.parameters) {
    processQueryParameter(
      sourceFile,
      methodDeclaration,
      parameter,
      queryParams,
      queryParamComponents
    );
  }
  return queryParams;
}

function processQueryParameter(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  parameter: ts.ParameterDeclaration,
  queryParams: QueryParamComponent[],
  queryParamComponents: { [name: string]: QueryParamComponent }
) {
  const queryParamDecorator = extractSingleDecorator(
    sourceFile,
    parameter,
    "queryParam"
  );
  if (!queryParamDecorator) {
    return;
  }
  const name = parameter.name.getText(sourceFile);

  if (queryParamComponents[name]) {
    throw panic(`Found multiple query parameters named ${name}`);
  } else {
    const queryParamComponent: QueryParamComponent = {
      name: name,
      description: "",
      type: extractParameterType(sourceFile, parameter)
    };
    queryParams.push(queryParamComponent);
    queryParamComponents[queryParamComponent.name] = queryParamComponent;
  }

  if (queryParamDecorator.arguments.length > 1) {
    throw panic(
      `Expected exactly one or no arguments for @queryParam(), got ${
        queryParamDecorator.arguments.length
      }`
    );
  }
  if (queryParamDecorator.arguments.length === 1) {
    const queryParamDescription = queryParamDecorator.arguments[0];
    if (!isObjectLiteral(queryParamDescription)) {
      throw panic(
        `@queryParam() expects an object literal, got this instead: ${methodDeclaration.getText(
          sourceFile
        )}`
      );
    }
    const nameProperty = queryParamDescription.properties["name"];
    if (nameProperty) {
      if (!isStringLiteral(nameProperty)) {
        throw panic(
          `@queryParam() expects a string name, got this instead: ${methodDeclaration.getText(
            sourceFile
          )}`
        );
      }
      queryParamComponents[name].queryName = nameProperty.text;
    }
    const descriptionProperty = queryParamDescription.properties["description"];
    if (descriptionProperty) {
      if (!isStringLiteral(descriptionProperty)) {
        throw panic(
          `@queryParam() expects a string description, got this instead: ${methodDeclaration.getText(
            sourceFile
          )}`
        );
      }
      queryParamComponents[name].description = descriptionProperty.text;
    }
  }
}
