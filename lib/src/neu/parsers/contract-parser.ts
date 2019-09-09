import { ClassDeclaration, SourceFile } from "ts-morph";
import { ApiConfig } from "../../syntax/api";
import { Config, Contract } from "../definitions";
import { ParserError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { ok, Result } from "../util";
import { defaultConfig, parseConfig } from "./config-parser";
import { parseEndpoint } from "./endpoint-parser";
import {
  getClassWithDecoratorOrThrow,
  getDecoratorConfigOrThrow,
  getJsDoc,
  getObjLiteralPropOrThrow,
  getPropertyWithDecorator,
  getPropValueAsStringOrThrow,
  getSelfAndLocalDependencies
} from "./parser-helpers";
import { parseSecurityHeader } from "./security-header-parser";

/**
 * Parse a root source file to return a contract.
 */
export function parseContract(
  file: SourceFile
): Result<{ contract: Contract; lociTable: LociTable }, Error> {
  const typeTable = new TypeTable();
  const lociTable = new LociTable();

  const klass = getClassWithDecoratorOrThrow(file, "api"); // TODO: throw a custom error
  const decorator = klass.getDecoratorOrThrow("api");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);
  const nameProp = getObjLiteralPropOrThrow<ApiConfig>(decoratorConfig, "name");
  const nameLiteral = getPropValueAsStringOrThrow(nameProp);
  const descriptionDoc = getJsDoc(klass);

  // Handle config
  const configResult = resolveConfig(klass);
  if (configResult.isErr()) return configResult;

  // Handle security
  const securityHeaderProp = getPropertyWithDecorator(klass, "securityHeader");
  const security =
    securityHeaderProp &&
    parseSecurityHeader(securityHeaderProp, typeTable, lociTable);
  if (security && security.isErr()) return security;

  // Add location data
  lociTable.addMorphNode(LociTable.apiClassKey(), klass);
  lociTable.addMorphNode(LociTable.apiDecoratorKey(), decorator);
  lociTable.addMorphNode(LociTable.apiNameKey(), nameProp);
  if (descriptionDoc) {
    lociTable.addMorphNode(LociTable.apiDescriptionKey(), descriptionDoc);
  }

  // Resolve all related files
  const projectFiles = getSelfAndLocalDependencies(file);

  // Parse all endpoints
  const endpointClasses = projectFiles.reduce<ClassDeclaration[]>(
    (acc, currentFile) =>
      acc.concat(
        currentFile
          .getClasses()
          .filter(k => k.getDecorator("endpoint") !== undefined)
      ),
    []
  );
  const endpoints = [];
  for (const k of endpointClasses) {
    const endpointResult = parseEndpoint(k, typeTable, lociTable);
    if (endpointResult.isErr()) return endpointResult;
    endpoints.push(endpointResult.unwrap());
  }

  const contract = {
    name: nameLiteral.getLiteralText(),
    description: descriptionDoc && descriptionDoc.getComment(),
    types: typeTable.toArray(),
    config: configResult.unwrap(),
    security: security && security.unwrap(),
    endpoints: endpoints.sort((a, b) => (b.name > a.name ? -1 : 1))
  };

  return ok({ contract, lociTable });
}

function resolveConfig(klass: ClassDeclaration): Result<Config, ParserError> {
  const hasConfigDecorator = klass.getDecorator("config") !== undefined;
  if (hasConfigDecorator) {
    return parseConfig(klass);
  } else {
    return ok(defaultConfig());
  }
}
