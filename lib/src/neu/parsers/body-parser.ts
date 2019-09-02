import { ParameterDeclaration } from "ts-morph";
import { Body } from "../definitions";
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
    throw new Error("@body parameter cannot be optional");
  }
  const type = parseType(parameter.getTypeNodeOrThrow(), typeTable, lociTable);
  // TODO: add loci information
  return { type };
}
