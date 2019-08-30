import { ClassDeclaration } from "ts-morph";
import { defaultConfigDefinition } from "../../models/definitions";
import { Locatable } from "../../models/locatable";
import { ConfigNode } from "../../models/nodes";
import { QueryParamArrayStrategy } from "../../models/types";
import {
  extractDecoratorFactoryConfiguration,
  extractOptionalObjectProperty,
  extractStringProperty
} from "../utilities/parser-utility";

/**
 * Parse an `@config` decorated class.
 *
 * @param klass a class declaration
 */
export function parseConfig(klass: ClassDeclaration): Locatable<ConfigNode> {
  const decorator = klass.getDecoratorOrThrow("config");

  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const paramSerializationStrategyProperty = extractOptionalObjectProperty(
    configuration,
    "paramSerializationStrategy"
  );

  const queryProperty = paramSerializationStrategyProperty
    ? extractOptionalObjectProperty(
        paramSerializationStrategyProperty.value,
        "query"
      )
    : undefined;

  const array = queryProperty
    ? (extractStringProperty(
        queryProperty.value,
        "array"
      ) as QueryParamArrayStrategy)
    : undefined;

  const value = array
    ? { paramSerializationStrategy: { query: { array } } }
    : defaultConfigDefinition;

  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return {
    value,
    location,
    line
  };
}
