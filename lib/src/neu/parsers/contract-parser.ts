import { SourceFile } from "ts-morph";
import { ApiConfig } from "../../syntax/api";
import { Contract, Endpoint } from "../definitions";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
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
): { contract: Contract; lociTable: LociTable } {
  const typeTable = new TypeTable();
  const lociTable = new LociTable();

  const klass = getClassWithDecoratorOrThrow(file, "api");
  const decorator = klass.getDecoratorOrThrow("api");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);
  const nameProp = getObjLiteralPropOrThrow<ApiConfig>(decoratorConfig, "name");
  const nameLiteral = getPropValueAsStringOrThrow(nameProp);
  const descriptionDoc = getJsDoc(klass);

  const securityHeaderProp = getPropertyWithDecorator(klass, "securityHeader");

  const security =
    securityHeaderProp &&
    parseSecurityHeader(securityHeaderProp, typeTable, lociTable);

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
  const endpoints = projectFiles
    .reduce<Endpoint[]>(
      (acc, currentFile) =>
        acc.concat(
          currentFile
            .getClasses()
            .filter(k => k.getDecorator("endpoint") !== undefined)
            .map(k => parseEndpoint(k, typeTable, lociTable))
        ),
      []
    )
    .sort((a, b) => {
      if (a.name === b.name) {
        throw new Error(`Duplicate endpoint detected: ${a.name}`);
      }
      return b.name > a.name ? -1 : 1;
    });

  const contract = {
    name: nameLiteral.getLiteralText(),
    description: descriptionDoc && descriptionDoc.getComment(),
    types: typeTable.toArray(),
    security,
    endpoints
  };

  return { contract, lociTable };
}
