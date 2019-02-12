import { ParameterDeclaration, PropertySignature } from "ts-morph";
import { Locatable } from "../../models/locatable";
import { HeaderNode } from "../../models/nodes";
import {
  ensureNodeNotOptional,
  extractJsDocCommentLocatable,
  extractObjectParameterProperties,
  extractPropertyName
} from "../utilities/parser-utility";
import { parseTypeNode } from "../utilities/type-parser";

/**
 * Parse a `@headers` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseHeaders(
  parameter: ParameterDeclaration
): Locatable<Locatable<HeaderNode>[]> {
  const decorator = parameter.getDecoratorOrThrow("headers");
  ensureNodeNotOptional(parameter);
  const properties = extractObjectParameterProperties(parameter);

  const headers = properties.map(property => parseHeader(property));
  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return { value: headers, location, line };
}

/**
 * Parse a header property.
 *
 * @param property a property signature
 */
function parseHeader(property: PropertySignature): Locatable<HeaderNode> {
  const name = {
    value: extractPropertyName(property),
    location: property.getSourceFile().getFilePath(),
    line: property.getStartLineNumber()
  };
  const description = extractJsDocCommentLocatable(property);
  const type = parseTypeNode(property.getTypeNodeOrThrow());
  const optional = property.hasQuestionToken();
  const header = { name, description, type, optional };
  return {
    value: header,
    location: property.getSourceFile().getFilePath(),
    line: property.getStartLineNumber()
  };
}
