import { createExistingSourceFile } from "../spec-helpers/helper";
import {
  getDecoratorConfigOrThrow,
  getSelfAndLocalDependencies
} from "./parser-helpers";

describe("parser-helpers", () => {
  describe("getSelfAndLocalDependencies", () => {
    test("resolves all local imports recursively", () => {
      const sourceFile = createExistingSourceFile(
        "./lib/src/neu/__spec-examples__/recursive-imports/source.ts"
      );
      const allFiles = getSelfAndLocalDependencies(sourceFile);
      const allFileNames = allFiles.map(f => f.getBaseNameWithoutExtension());

      expect(allFileNames).toHaveLength(6);
      expect(allFileNames).toContain("source");
      expect(allFileNames).toContain("import-1");
      expect(allFileNames).toContain("import-2");
      expect(allFileNames).toContain("import-1-1");
      expect(allFileNames).toContain("import-1-2");
      expect(allFileNames).toContain("import-1-1-1");
    });
  });

  describe("getDecoratorConfigOrThrow", () => {
    const sourceFile = createExistingSourceFile(
      "./lib/src/neu/__spec-examples__/decorators.ts"
    );

    test("returns the first argument of a decorator factory that conforms to configuration", () => {
      const klass = sourceFile.getClassOrThrow("DecoratorFactoryConfig");
      const decorator = klass.getDecoratorOrThrow("decoratorFactoryConfig");
      expect(() => getDecoratorConfigOrThrow(decorator)).not.toThrowError();
    });

    test("throws when given a decorator factory that does not conform to configuration", () => {
      const klass = sourceFile.getClassOrThrow("DecoratorFactoryNotConfig");
      const decorator = klass.getDecoratorOrThrow("decoratorFactoryNotConfig");
      expect(() => getDecoratorConfigOrThrow(decorator)).toThrowError();
    });

    test("throws when given a plain decorator", () => {
      const klass = sourceFile.getClassOrThrow("DecoratorPlain");
      const decorator = klass.getDecoratorOrThrow("decoratorPlain");
      expect(() => getDecoratorConfigOrThrow(decorator)).toThrowError();
    });
  });
});
