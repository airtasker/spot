import { ParameterDeclaration } from "ts-morph";
import { PathParam } from "../definitions";
import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { err, ok, Result } from "../util";
import {
  getJsDoc,
  getParameterTypeAsTypeLiteralOrThrow,
  getPropertyName
} from "./parser-helpers";
import { parseType } from "./type-parser";

export function parsePathParams(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<PathParam[], ParserError> {
  parameter.getDecoratorOrThrow("pathParams");
  if (parameter.hasQuestionToken()) {
    return err(
      new OptionalNotAllowedError("@pathParams parameter cannot be optional", {
        file: parameter.getSourceFile().getFilePath(),
        position: parameter.getQuestionTokenNodeOrThrow().getPos()
      })
    );
  }
  const type = getParameterTypeAsTypeLiteralOrThrow(parameter);

  const pathParams = [];
  for (const propertySignature of type.getProperties()) {
    if (propertySignature.hasQuestionToken()) {
      return err(
        new OptionalNotAllowedError(
          "@pathParams properties cannot be optional",
          {
            file: propertySignature.getSourceFile().getFilePath(),
            position: propertySignature.getQuestionTokenNodeOrThrow().getPos()
          }
        )
      );
    }

    const typeResult = parseType(
      propertySignature.getTypeNodeOrThrow(),
      typeTable,
      lociTable
    );
    if (typeResult.isErr()) return typeResult;
    const pDescription = getJsDoc(propertySignature);

    const pathParam = {
      name: getPropertyName(propertySignature),
      type: typeResult.unwrap(),
      description: pDescription && pDescription.getComment()
    };

    pathParams.push(pathParam);
  }

  // TODO: add loci information
  return ok(pathParams.sort((a, b) => (b.name > a.name ? -1 : 1)));
}
