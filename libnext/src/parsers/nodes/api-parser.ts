import { ClassDeclaration } from "ts-simple-ast";
import { Locatable } from "../../models/locatable";
import { ApiNode } from "../../models/nodes";
import {
  extractDecoratorFactoryConfiguration,
  extractJsDocCommentLocatable,
  extractStringPropertyValueLocatable
} from "../utilities/parser-utility";

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
  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return {
    value: { name, description },
    location,
    line
  };
}
