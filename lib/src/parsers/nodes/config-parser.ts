import { ClassDeclaration } from "ts-morph";
import { Locatable } from "../../models/locatable";
import { ConfigNode } from "../../models/nodes";

import {
  extractDecoratorFactoryConfiguration,
  extractOptionalObjectProperty
} from "../utilities/parser-utility";

/**
 * Parse an `@config` decorated class.
 *
 * @param klass a class declaration
 */
export function parseConfig(klass: ClassDeclaration): Locatable<ConfigNode> {
  const decorator = klass.getDecoratorOrThrow("config");

  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const paramSerializationStrategy = extractOptionalObjectProperty(
    configuration,
    "paramSerializationStrategy"
  );

  const value = paramSerializationStrategy
    ? paramSerializationStrategy.value
    : {};

  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return {
    value,
    location,
    line
  };
}
