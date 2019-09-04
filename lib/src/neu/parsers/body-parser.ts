import { ParameterDeclaration } from "ts-morph";
import { Body } from "../definitions";
import { OptionalNotAllowedError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { parseType } from "./type-parser";

export function parseBody(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Body {
  parameter.getDecoratorOrThrow("body");
  if (parameter.hasQuestionToken()) {
    throw new OptionalNotAllowedError("@body parameter cannot be optional", {
      file: parameter.getSourceFile().getFilePath(),
      position: parameter.getQuestionTokenNodeOrThrow().getPos()
    });
  }
  const type = parseType(parameter.getTypeNodeOrThrow(), typeTable, lociTable);
  // TODO: add loci information
  return { type };
}
