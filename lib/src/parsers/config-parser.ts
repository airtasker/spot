import { ClassDeclaration } from "ts-morph";
import { Config } from "../definitions";
import { ParserError } from "../errors";
import { ConfigConfig } from "../syntax";
import { ok, Result } from "../util";
import {
  getDecoratorConfigOrThrow,
  getObjLiteralProp,
  getObjLiteralPropOrThrow,
  getPropValueAsObjectOrThrow,
  getPropValueAsStringOrThrow,
  isQueryParamArrayStrategy
} from "./parser-helpers";

export function parseConfig(
  klass: ClassDeclaration
): Result<Config, ParserError> {
  const decorator = klass.getDecoratorOrThrow("config");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);

  const paramStratProp = getObjLiteralPropOrThrow<ConfigConfig>(
    decoratorConfig,
    "paramSerializationStrategy"
  );

  const paramsStrat: Config = defaultConfig();

  const paramStratLiteral = getPropValueAsObjectOrThrow(paramStratProp);
  const queryStrategyProp = getObjLiteralProp<
    ConfigConfig["paramSerializationStrategy"]
  >(paramStratLiteral, "query");

  if (queryStrategyProp) {
    const queryStratLiteral = getPropValueAsObjectOrThrow(queryStrategyProp);
    const queryArrayStratProp = getObjLiteralProp<
      Required<ConfigConfig["paramSerializationStrategy"]>["query"]
    >(queryStratLiteral, "array");

    if (queryArrayStratProp) {
      const queryArrayStratValue =
        getPropValueAsStringOrThrow(queryArrayStratProp).getLiteralText();
      if (!isQueryParamArrayStrategy(queryArrayStratValue)) {
        throw new Error(
          `expected a QueryParamArrayStrategy, got ${queryArrayStratValue}`
        );
      }
      paramsStrat.paramSerializationStrategy.query.array = queryArrayStratValue;
    }
  }

  return ok(paramsStrat);
}

export function defaultConfig(): Config {
  return {
    paramSerializationStrategy: {
      query: {
        array: "ampersand"
      }
    }
  };
}
