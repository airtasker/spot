import * as fs from "fs-extra";
import * as path from "path";
import * as ts from "typescript";
import { Api } from "../models";
import { validate } from "../validator";
import { extractSingleDecorator } from "./decorators";
import { parseApiClass } from "./nodes/api-class";
import { panic } from "./panic";
import { extractObjectType, extractType } from "./type-parser";
import { parseEndpointMethod } from "./nodes/endpoint-method";
import { ApiDescription } from "@airtasker/spot";
const merge = require("lodash/merge");

/**
 * Parses a TypeScript source file, as well as any other TypeScript files it imports recursively.
 *
 * This should be smart enough not to get stuck into an infinite loop for circular dependencies.
 */
export async function parsePath(sourcePath: string): Promise<Api> {
  const api: Api = parseRootFile(sourcePath);
  const errors = validate(api);
  if (errors.length > 0) {
    throw panic(errors.join("\n"));
  }
  return api;
}

function extractSourceFile(sourcePath: string) {
  if (!fs.existsSync(sourcePath)) {
    if (fs.existsSync(sourcePath + ".ts")) {
      sourcePath += ".ts";
    } else {
      throw panic(`No source file found at ${sourcePath}`);
    }
  }

  const fileContent = fs.readFileSync(sourcePath, "utf8");
  const sourceFile = ts.createSourceFile(
    path.basename(sourcePath),
    fileContent,
    ts.ScriptTarget.Latest
  );
  return sourceFile;
}

function getPathsRecursively(sourcePath: string): Set<string> {
  const importPaths = new Set();
  const sourceFile = extractSourceFile(sourcePath);

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (!ts.isStringLiteral(statement.moduleSpecifier)) {
        throw panic(
          `Unsupported import statement: ${statement.moduleSpecifier.getText(
            sourceFile
          )}`
        );
      }
      const importPath = statement.moduleSpecifier.text;
      if (!importPath.startsWith(".")) {
        // This is not a relative import, we'll ignore it.
        continue;
      }
      if (
        !(
          importPaths.has(importPath) ||
          path.resolve(importPath).startsWith(__dirname)
        )
      ) {
        importPaths.add(path.join(sourcePath, "..", importPath));
      }
    }
  }
  return new Set([
    ...importPaths,
    ...[...importPaths].reduce((acc, importPath) => {
      return new Set([...acc, ...getPathsRecursively(importPath)]);
    }, new Set())
  ]);
}

function parseRootFile(sourcePath: string): Api {
  const importPaths = getPathsRecursively(sourcePath);

  const api: Api = {
    endpoints: {},
    types: {}
  };

  if (containsApiDeclaration(sourcePath)) {
    const sourceFile = extractSourceFile(sourcePath);
    for (const statement of sourceFile.statements) {
      if (ts.isClassDeclaration(statement)) {
        const apiDescription: ApiDescription = parseApiClass(
          sourceFile,
          statement
        );
        if (apiDescription) {
          api.description = apiDescription;
        }
        parseEndpoint(statement, sourceFile, api);
      } else if (ts.isTypeAliasDeclaration(statement)) {
        const name = statement.name.getText(sourceFile);
        api.types[name] = extractType(sourceFile, statement.type);
      } else if (ts.isInterfaceDeclaration(statement)) {
        const name = statement.name.getText(sourceFile);
        api.types[name] = extractObjectType(sourceFile, statement);
      }
    }
    return [...importPaths].reduce((acc, path) => {
      return merge(acc, parseFile(path));
    }, api);
  } else {
    throw `No @api declaration found at ${sourcePath}`;
  }
}

function parseEndpoint(
  statement: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  api: Api
) {
  for (const member of statement.members) {
    if (ts.isMethodDeclaration(member)) {
      parseEndpointMethod(sourceFile, member, api);
    }
  }
}

function parseFile(sourcePath: string): Api {
  const api: Api = {
    endpoints: {},
    types: {}
  };

  const sourceFile = extractSourceFile(sourcePath);
  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      const apiDecorator = extractSingleDecorator(sourceFile, statement, "api");
      if (apiDecorator) {
        throw `@api cannot be defined more than once at ${sourcePath}`;
      }
      parseEndpoint(statement, sourceFile, api);
    } else if (ts.isTypeAliasDeclaration(statement)) {
      const name = statement.name.getText(sourceFile);
      api.types[name] = extractType(sourceFile, statement.type);
    } else if (ts.isInterfaceDeclaration(statement)) {
      const name = statement.name.getText(sourceFile);
      api.types[name] = extractObjectType(sourceFile, statement);
    }
  }

  return api;
}

function containsApiDeclaration(sourcePath: string): boolean {
  const sourceFile = extractSourceFile(sourcePath);
  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      const apiDecorator = extractSingleDecorator(sourceFile, statement, "api");
      if (apiDecorator) {
        return true;
      }
    }
  }
  return false;
}
