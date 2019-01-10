import { ClassDeclaration } from "ts-simple-ast";
import { ParsedApi } from "../../models/parsed-nodes";
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
export function parseApi(klass: ClassDeclaration): ParsedApi {
  const decorator = klass.getDecoratorOrThrow("api");
  const description = extractJsDocComment(klass);
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const name = extractStringProperty(configuration, "name");
  return { name, description };
}
