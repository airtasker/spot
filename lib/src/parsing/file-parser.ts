import { ApiDescription } from "@airtasker/spot";
import * as fs from "fs-extra";
import merge from "lodash/merge";
import * as path from "path";
import * as ts from "typescript";
import { Api, Endpoint, Type } from "../models";
import { validate } from "../validator";
import { extractSingleDecorator } from "./decorators";
import { parseApiClass } from "./nodes/api-class";
import { parseEndpointMethod } from "./nodes/endpoint-method";
import { panic } from "./panic";
import { extractObjectType, extractType } from "./type-parser";

/**
 * Parses a TypeScript source file, as well as any other TypeScript files it imports recursively.
 *
 * This should be smart enough not to get stuck into an infinite loop for circular dependencies.
 */
export async function parsePath(sourcePath: string): Promise<Api> {
  if (!isValidTypeScript(sourcePath)) {
    throw panic("TypeScript compilation error");
  }
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
    types: {},
    description: {
      name: "",
      description: ""
    }
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
        api.endpoints = parseEndpoints(statement, sourceFile);
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
    throw panic(`No @api declaration found at ${sourcePath}`);
  }
}

function parseEndpoints(
  statement: ts.ClassDeclaration,
  sourceFile: ts.SourceFile
): {
  [name: string]: Endpoint;
} {
  const endpoints: {
    [name: string]: Endpoint;
  } = {};
  for (const member of statement.members) {
    if (ts.isMethodDeclaration(member)) {
      // Each endpoint must be defined only once.
      const endpointName: string = member.name.getText(sourceFile);
      if (endpoints[endpointName]) {
        throw panic(
          `Found multiple definitions of the same endpoint ${endpointName}`
        );
      }
      endpoints[endpointName] = parseEndpointMethod(sourceFile, member);
    }
  }
  return endpoints;
}

function parseFile(
  sourcePath: string
): {
  endpoints: {
    [name: string]: Endpoint;
  };
  types: {
    [name: string]: Type;
  };
} {
  const api: {
    endpoints: {
      [name: string]: Endpoint;
    };
    types: {
      [name: string]: Type;
    };
  } = {
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
      api.endpoints = parseEndpoints(statement, sourceFile);
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

/**
 * Check for TypeScript errors
 */
function isValidTypeScript(sourcePath: string): boolean {
  const program = ts.createProgram([sourcePath], {
    target: ts.ScriptTarget.ESNext,
    experimentalDecorators: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    baseUrl: "./",
    paths: {
      "@airtasker/spot": ["./lib/src/lib"]
    }
  });
  let diagnostics = ts.getPreEmitDiagnostics(program);
  diagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      let message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      console.error(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.error(
        `${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
      );
    }
  });
  return diagnostics.length === 0;
}
