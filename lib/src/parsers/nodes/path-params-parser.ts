import { ParameterDeclaration, PropertySignature } from "ts-morph";
import { Locatable } from "../../models/locatable";
import { PathParamNode } from "../../models/nodes";
import {
  ensureNodeNotOptional,
  extractJsDocCommentLocatable,
  extractObjectParameterProperties,
  extractPropertyName
} from "../utilities/parser-utility";
import { parseTypeNode } from "../utilities/type-parser";

/**
 * Parse an `@pathParams` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parsePathParams(
  parameter: ParameterDeclaration
): Locatable<Locatable<PathParamNode>[]> {
  const decorator = parameter.getDecoratorOrThrow("pathParams");
  ensureNodeNotOptional(parameter);
  const properties = extractObjectParameterProperties(parameter);

  const pathParams = properties.map(property => parsePathParam(property));
  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return { value: pathParams, location, line };
}

/**
 * Parse a path param property.
 *
 * @param property a property signature
 */
function parsePathParam(property: PropertySignature): Locatable<PathParamNode> {
  ensureNodeNotOptional(property);

  const name = {
    value: extractPropertyName(property),
    location: property.getSourceFile().getFilePath(),
    line: property.getStartLineNumber()
  };
  const description = extractJsDocCommentLocatable(property);
  const type = parseTypeNode(property.getTypeNodeOrThrow());
  const pathParam = { name, description, type };
  return {
    value: pathParam,
    location: property.getSourceFile().getFilePath(),
    line: property.getStartLineNumber()
  };
}
