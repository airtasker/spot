import { ParameterDeclaration } from "ts-morph";
import { Body } from "../definitions";
import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { err, ok, Result } from "../util";
import { parseType } from "./type-parser";

export function parseBody(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Body, ParserError> {
  // TODO: retrieve JsDoc as body description https://github.com/dsherret/ts-morph/issues/753
  parameter.getDecoratorOrThrow("body");
  if (parameter.hasQuestionToken()) {
    return err(
      new OptionalNotAllowedError("@body parameter cannot be optional", {
        file: parameter.getSourceFile().getFilePath(),
        position: parameter.getQuestionTokenNodeOrThrow().getPos()
      })
    );
  }
  const typeResult = parseType(
    parameter.getTypeNodeOrThrow(),
    typeTable,
    lociTable
  );
  if (typeResult.isErr()) return typeResult;
  // TODO: add loci information
  return ok({ type: typeResult.unwrap() });
}
