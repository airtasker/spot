import { ParameterDeclaration, PropertySignature } from "ts-simple-ast";
import { Locatable } from "../../models/locatable";
import { QueryParamNode } from "../../models/nodes";
import {
  ensureNodeNotOptional,
  extractJsDocCommentLocatable,
  extractObjectParameterProperties,
  extractPropertyName
} from "../utilities/parser-utility";
import { parseTypeNode } from "../utilities/type-parser";

/**
 * Parse an `@queryParams` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseQueryParams(
  parameter: ParameterDeclaration
): Locatable<Locatable<QueryParamNode>[]> {
  const decorator = parameter.getDecoratorOrThrow("queryParams");
  ensureNodeNotOptional(parameter);
  const properties = extractObjectParameterProperties(parameter);

  const queryParams = properties.map(property => parseQueryParam(property));
  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return { value: queryParams, location, line };
}

/**
 * Parse a query param property.
 *
 * @param property a property signature
 */
function parseQueryParam(
  property: PropertySignature
): Locatable<QueryParamNode> {
  const name = {
    value: extractPropertyName(property),
    location: property.getSourceFile().getFilePath(),
    line: property.getStartLineNumber()
  };
  const description = extractJsDocCommentLocatable(property);
  const type = parseTypeNode(property.getTypeNodeOrThrow());
  const optional = property.hasQuestionToken();
  const queryParam = { name, description, type, optional };
  return {
    value: queryParam,
    location: property.getSourceFile().getFilePath(),
    line: property.getStartLineNumber()
  };
}
