import { ParameterDeclaration, PropertySignature } from "ts-morph";
import { Header } from "../definitions";
import { OptionalNotAllowedError, ParserError } from "../errors";
import { isHeaderTypeSafe } from "../http";
import { LociTable } from "../locations";
import { Type, TypeTable } from "../types";
import { err, ok, Result } from "../util";
import {
  getJsDoc,
  getParameterPropertySignaturesOrThrow,
  getPropertyName
} from "./parser-helpers";
import { parseType } from "./type-parser";

export function parseHeaders(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Header[], ParserError> {
  parameter.getDecoratorOrThrow("headers");

  if (parameter.hasQuestionToken()) {
    return err(
      new OptionalNotAllowedError("@headers parameter cannot be optional", {
        file: parameter.getSourceFile().getFilePath(),
        position: parameter.getQuestionTokenNodeOrThrow().getPos()
      })
    );
  }

  const headerPropertySignatures = getParameterPropertySignaturesOrThrow(
    parameter
  );

  const headers = [];
  for (const propertySignature of headerPropertySignatures) {
    const nameResult = extractHeaderName(propertySignature);
    if (nameResult.isErr()) return nameResult;
    const name = nameResult.unwrap();

    const typeResult = extractHeaderType(
      propertySignature,
      typeTable,
      lociTable
    );
    if (typeResult.isErr()) return typeResult;
    const type = typeResult.unwrap();

    const description = getJsDoc(propertySignature)?.getDescription().trim();

    const optional = propertySignature.hasQuestionToken();

    headers.push({ name, type, description, optional });
  }

  return ok(headers.sort((a, b) => (b.name > a.name ? -1 : 1)));
}

function extractHeaderName(
  propertySignature: PropertySignature
): Result<string, ParserError> {
  const name = getPropertyName(propertySignature);
  if (!/^[\w-]*$/.test(name)) {
    return err(
      new ParserError(
        "@headers field name may only contain alphanumeric, underscore and hyphen characters",
        {
          file: propertySignature.getSourceFile().getFilePath(),
          position: propertySignature.getPos()
        }
      )
    );
  }
  if (name.length === 0) {
    return err(
      new ParserError("@headers field name must not be empty", {
        file: propertySignature.getSourceFile().getFilePath(),
        position: propertySignature.getPos()
      })
    );
  }
  return ok(name);
}

function extractHeaderType(
  propertySignature: PropertySignature,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Type, ParserError> {
  const typeResult = parseType(
    propertySignature.getTypeNodeOrThrow(),
    typeTable,
    lociTable
  );
  if (typeResult.isErr()) return typeResult;

  if (!isHeaderTypeSafe(typeResult.unwrap(), typeTable)) {
    return err(
      new ParserError(
        "header type may only derive from string or number types",
        {
          file: propertySignature.getSourceFile().getFilePath(),
          position: propertySignature.getPos()
        }
      )
    );
  }

  return typeResult;
}
