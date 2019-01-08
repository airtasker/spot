import { ParameterDeclaration } from "ts-simple-ast";
import { BodyDefinition } from "../../models/definitions";
import { parseType } from "../utilities/type-parser";
import { isObjectType, isReferenceType } from "../../models/types";

/**
 * Parse an `@body` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseBody(parameter: ParameterDeclaration): BodyDefinition {
  parameter.getDecoratorOrThrow("body");
  const dataType = parseType(parameter.getType());
  if (isObjectType(dataType) || isReferenceType(dataType)) {
    return {
      // TODO: how to extract description from parameter declaration?
      description: undefined,
      type: dataType,
      optional: parameter.hasQuestionToken()
    };
  } else {
    throw new Error("expected object or reference type");
  }
}
