import { ClassDeclaration, SourceFile } from "ts-morph";
import { Config, Contract, Endpoint } from "../definitions";
import { ParserError } from "../errors";
import { LociTable } from "../locations";
import { ApiConfig } from "../syntax/api";
import { TypeTable } from "../types";
import { err, ok, Result } from "../util";
import { defaultConfig, parseConfig } from "./config-parser";
import { parseEndpoint } from "./endpoint-parser";
import {
  getClassWithDecoratorOrThrow,
  getDecoratorConfigOrThrow,
  getJsDoc,
  getObjLiteralProp,
  getObjLiteralPropOrThrow,
  getPropertyWithDecorator,
  getPropValueAsStringOrThrow,
  getSelfAndLocalDependencies
} from "./parser-helpers";
import { parseSecurityHeader } from "./security-header-parser";

import { parseOa3Servers } from "./oa3server-parser";

/**
 * Parse a root source file to return a contract.
 */
export function parseContract(
  file: SourceFile
): Result<{ contract: Contract; lociTable: LociTable }, ParserError> {
  const typeTable = new TypeTable();
  const lociTable = new LociTable();

  const klass = getClassWithDecoratorOrThrow(file, "api");
  const decorator = klass.getDecoratorOrThrow("api");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);

  // Handle name
  const nameProp = getObjLiteralPropOrThrow<ApiConfig>(decoratorConfig, "name");
  const nameLiteral = getPropValueAsStringOrThrow(nameProp);
  const name = nameLiteral.getLiteralText().trim();
  if (name.length === 0) {
    return err(
      new ParserError("api name cannot be empty", {
        file: nameLiteral.getSourceFile().getFilePath(),
        position: nameLiteral.getPos()
      })
    );
  }
  if (!/^[\w\s-]*$/.test(name)) {
    return err(
      new ParserError(
        "api name may only contain alphanumeric, space, underscore and hyphen characters",
        {
          file: nameLiteral.getSourceFile().getFilePath(),
          position: nameLiteral.getPos()
        }
      )
    );
  }

  // Handle description
  const descriptionDoc = getJsDoc(klass);
  const description = descriptionDoc?.getDescription().trim();

  // Handle Version
  const versionProp = getObjLiteralProp<ApiConfig>(decoratorConfig, "version");
  const version = versionProp
    ? getPropValueAsStringOrThrow(versionProp).getLiteralText().trim()
    : undefined;

  // Handle config
  const configResult = resolveConfig(klass);
  if (configResult.isErr()) return configResult;
  const config = configResult.unwrap();

  // Handle security
  const securityHeaderProp = getPropertyWithDecorator(klass, "securityHeader");
  const securityResult =
    securityHeaderProp &&
    parseSecurityHeader(securityHeaderProp, typeTable, lociTable);
  if (securityResult && securityResult.isErr()) return securityResult;
  const security = securityResult?.unwrap();

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
  const endpointsResult = extractEndpoints(
    endpointClasses,
    typeTable,
    lociTable
  );
  if (endpointsResult.isErr()) return endpointsResult;
  const endpoints = endpointsResult.unwrap();

  // Handle Types
  const types = typeTable.toArray();

  // Handle Servers
  const serversResult = parseOa3Servers(klass, typeTable, lociTable);
  if (serversResult.isErr()) return serversResult;
  const oa3servers = serversResult.unwrap();

  const contract = {
    name,
    description,
    types,
    config,
    security,
    endpoints,
    version,
    oa3servers
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

function extractEndpoints(
  endpointClasses: ClassDeclaration[],
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Endpoint[], ParserError> {
  const endpointNames = endpointClasses.map(k => k.getNameOrThrow());
  const duplicateEndpointNames = [
    ...new Set(
      endpointNames.filter(
        (name, index) => endpointNames.indexOf(name) !== index
      )
    )
  ];
  if (duplicateEndpointNames.length !== 0) {
    const locations = duplicateEndpointNames.reduce<
      { file: string; position: number }[]
    >((acc, name) => {
      const nameLocations = endpointClasses
        .filter(k => k.getNameOrThrow() === name)
        .map(k => {
          return {
            file: k.getSourceFile().getFilePath(),
            position: k.getPos()
          };
        });
      return acc.concat(nameLocations);
    }, []);

    return err(
      new ParserError("endpoints must have unique names", ...locations)
    );
  }

  const endpoints = [];
  for (const k of endpointClasses) {
    const endpointResult = parseEndpoint(k, typeTable, lociTable);
    if (endpointResult.isErr()) return endpointResult;
    endpoints.push(endpointResult.unwrap());
  }
  return ok(endpoints);
}
