import ts from "typescript";
import { DynamicPathComponent, PathComponent, VOID } from "../../models";
import { extractSingleDecorator } from "../decorators";
import {
  isObjectLiteral,
  isStringLiteral,
  ObjectLiteral
} from "../literal-parser";
import { panic } from "../panic";
import { extractParameterType } from "./parameter-type";

/**
 * Returns the path of an endpoint.
 *
 * For example:
 * ```
 * @endpoint({
 *   method: "GET",
 *   path: "/users/:userId"
 * })
 * getUser(@pathParam() userId: string): User {
 *   ...
 * }
 * ```
 *
 * will return a list of path components with:
 * - a static component ("/users/")
 * - a dynamic component named userId of type string
 */
export function extractPath(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  endpointDescription: ObjectLiteral
): PathComponent[] {
  const pathLiteral = endpointDescription.properties["path"];
  if (!isStringLiteral(pathLiteral)) {
    throw panic(
      `Invalid path in endpoint description: ${methodDeclaration.getText(
        sourceFile
      )}`
    );
  }
  const path = pathLiteral.text;
  const pathComponents: PathComponent[] = [];
  const dynamicPathComponents: { [name: string]: DynamicPathComponent } = {};
  if (path.length > 0) {
    let componentStartPosition = 0;
    do {
      if (path.charAt(componentStartPosition) === ":") {
        // The parameter name extends until a character that isn't a valid name.
        const nextNonNamePositionRelative = path
          .substr(componentStartPosition + 1)
          .search(/[^a-z0-9_]/gi);
        const dynamicPathComponent: DynamicPathComponent = {
          kind: "dynamic",
          name: path.substr(
            componentStartPosition + 1,
            nextNonNamePositionRelative === -1
              ? undefined
              : nextNonNamePositionRelative
          ),
          type: VOID,
          description: ""
        };
        pathComponents.push(dynamicPathComponent);
        dynamicPathComponents[dynamicPathComponent.name] = dynamicPathComponent;
        componentStartPosition =
          nextNonNamePositionRelative === -1
            ? -1
            : componentStartPosition + 1 + nextNonNamePositionRelative;
      } else {
        // The static component extends until the next parameter, which starts with ":".
        const nextColumnPosition = path.indexOf(":", componentStartPosition);
        pathComponents.push({
          kind: "static",
          content: path.substring(
            componentStartPosition,
            nextColumnPosition === -1 ? undefined : nextColumnPosition
          )
        });
        componentStartPosition = nextColumnPosition;
      }
    } while (componentStartPosition !== -1);
  }
  for (const parameter of methodDeclaration.parameters) {
    processPathParameter(
      sourceFile,
      methodDeclaration,
      parameter,
      dynamicPathComponents
    );
  }
  return pathComponents;
}

function processPathParameter(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  parameter: ts.ParameterDeclaration,
  dynamicPathComponents: { [name: string]: DynamicPathComponent }
) {
  const pathParamDecorator = extractSingleDecorator(
    sourceFile,
    parameter,
    "pathParam"
  );
  if (!pathParamDecorator) {
    return;
  }
  const name = parameter.name.getText(sourceFile);
  if (dynamicPathComponents[name]) {
    dynamicPathComponents[name].type = extractParameterType(
      sourceFile,
      parameter
    );
  } else {
    throw panic(
      `Found a path parameter that isn't present in path. Expected one of [${Object.keys(
        dynamicPathComponents
      ).join(", ")}], got this instead: ${name}`
    );
  }
  if (pathParamDecorator.arguments.length > 1) {
    throw panic(
      `Expected exactly one or no arguments for @pathParam(), got ${
        pathParamDecorator.arguments.length
      }`
    );
  }
  if (pathParamDecorator.arguments.length === 1) {
    const pathParamDescription = pathParamDecorator.arguments[0];
    if (!isObjectLiteral(pathParamDescription)) {
      throw panic(
        `@pathParam() expects an object literal, got this instead: ${methodDeclaration.getText(
          sourceFile
        )}`
      );
    }
    const descriptionProperty = pathParamDescription.properties["description"];
    if (!descriptionProperty || !isStringLiteral(descriptionProperty)) {
      throw panic(
        `@pathParam() expects a string description, got this instead: ${methodDeclaration.getText(
          sourceFile
        )}`
      );
    }
    dynamicPathComponents[name].description = descriptionProperty.text;
  }
}
