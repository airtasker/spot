import { ClassDeclaration } from "ts-simple-ast";
import { ApiNode } from "../../models/nodes";
import {
  extractDecoratorFactoryConfiguration,
  extractJsDocComment,
  extractStringProperty
} from "../utilities/parser-utility";

/**
 * Parse an `@api` decorated class.
 *
 * @param klass a class declaration
 */
export function parseApi(klass: ClassDeclaration): ApiNode {
  const decorator = klass.getDecoratorOrThrow("api");
  const description = extractJsDocComment(klass);
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const name = extractStringProperty(configuration, "name");
  return { name, description };
}
