import * as fs from "fs-extra";
import * as path from "path";
import * as ts from "typescript";
import { Api } from "../models";
import { validate } from "../validator";
import { extractSingleDecorator } from "./decorators";
import { parseApiClass } from "./nodes/api-class";
import { panic } from "./panic";
import { extractObjectType, extractType } from "./type-parser";

/**
 * Parses a TypeScript source file, as well as any other TypeScript files it imports recursively.
 *
 * This should be smart enough not to get stuck into an infinite loop for circular dependencies.
 */
export async function parsePath(sourcePath: string): Promise<Api> {
  const api: Api = {
    endpoints: {},
    types: {}
  };
  await parseFileRecursively(api, new Set(), sourcePath);
  const errors = validate(api);
  if (errors.length > 0) {
    throw panic(errors.join("\n"));
  }
  return api;
}

async function parseFileRecursively(
  api: Api,
  visitedPaths: Set<string>,
  sourcePath: string
): Promise<void> {
  if (!(await fs.existsSync(sourcePath))) {
    if (await fs.existsSync(sourcePath + ".ts")) {
      sourcePath += ".ts";
    } else {
      throw panic(`No source file found at ${sourcePath}`);
    }
  }
  if (
    visitedPaths.has(sourcePath) ||
    path.resolve(sourcePath).startsWith(__dirname)
  ) {
    return;
  } else {
    visitedPaths.add(sourcePath);
  }
  const fileContent = await fs.readFile(sourcePath, "utf8");
  const sourceFile = ts.createSourceFile(
    path.basename(sourcePath),
    fileContent,
    ts.ScriptTarget.Latest
  );

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
      await parseFileRecursively(
        api,
        visitedPaths,
        path.join(sourcePath, "..", importPath)
      );
    } else if (ts.isClassDeclaration(statement)) {
      const apiDecorator = extractSingleDecorator(sourceFile, statement, "api");
      if (apiDecorator) {
        parseApiClass(sourceFile, statement);
      }
    } else if (ts.isTypeAliasDeclaration(statement)) {
      const name = statement.name.getText(sourceFile);
      api.types[name] = extractType(sourceFile, statement.type);
    } else if (ts.isInterfaceDeclaration(statement)) {
      const name = statement.name.getText(sourceFile);
      api.types[name] = extractObjectType(sourceFile, statement);
    }
  }
}
