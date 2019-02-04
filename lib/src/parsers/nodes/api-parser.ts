import { ClassDeclaration } from "ts-simple-ast";
import { Locatable } from "../../models/locatable";
import { ApiNode } from "../../models/nodes";
import {
  classPropertyWithDecorator,
  extractDecoratorFactoryConfiguration,
  extractJsDocCommentLocatable,
  extractStringPropertyValueLocatable
} from "../utilities/parser-utility";
import { parseSecurityHeader } from "./security-header-parser";

/**
 * Parse an `@api` decorated class.
 *
 * @param klass a class declaration
 */
export function parseApi(klass: ClassDeclaration): Locatable<ApiNode> {
  const decorator = klass.getDecoratorOrThrow("api");
  const description = extractJsDocCommentLocatable(klass);
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const name = extractStringPropertyValueLocatable(configuration, "name");
  const securityHeaderProperty = classPropertyWithDecorator(
    klass,
    "securityHeader"
  );
  const securityHeader =
    securityHeaderProperty && parseSecurityHeader(securityHeaderProperty);
  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return {
    value: { name, description, securityHeader },
    location,
    line
  };
}
