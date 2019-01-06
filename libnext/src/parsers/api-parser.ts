import { ClassDeclaration } from "ts-simple-ast";
import {
  extractJsDocComment,
  extractStringProperty,
  extractDecoratorFactoryConfiguration
} from "./utilities/parser-utility";
import { ApiDefinition } from "../models/definitions";

/**
 * Parse an `@api` decorated class.
 *
 * @param klass a class declaration
 */
export function parseApi(klass: ClassDeclaration): ApiDefinition {
  const decorator = klass.getDecoratorOrThrow("api");
  const description = extractJsDocComment(klass);
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const name = extractStringProperty(configuration, "name");
  return { name, description };
}
