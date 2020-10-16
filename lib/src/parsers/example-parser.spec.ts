import { extractJSDocExamples } from "./example-parser";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import {
  getJsDoc,
  parseTypeReferencePropertySignaturesOrThrow
} from "./parser-helpers";
import { JSDoc, TypeAliasDeclaration } from "ts-morph";
import { StringType, Type, TypeKind } from "../types";

type JSDocNodeMapping = {
  ParsedExamples: JSDoc[];
  MismatchedExampleAndIntegerType: JSDoc[];
  MismatchedExampleAndStringWithQuotesType: JSDoc[];
  [typeName: string]: JSDoc[];
};
describe("example-parser", () => {
  describe("extractJSDocExamples", () => {
    const jsDocs: JSDocNodeMapping = {} as JSDocNodeMapping;
    const sourceFile = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/examples.ts`
    ).file;
    const typeValues = sourceFile.getTypeAliases();

    typeValues.forEach((typeAlias: TypeAliasDeclaration) => {
      const properties = parseTypeReferencePropertySignaturesOrThrow(
        typeAlias.getTypeNodeOrThrow()
      );
      const name = typeAlias.getName();
      jsDocs[name] = [];
      for (const property of properties) {
        const jsDocNode = getJsDoc(property);
        if (jsDocNode) {
          jsDocs[name].push(jsDocNode);
        }
      }
    });

    test("successfully parses string examples on properties on type ParsedExamples", () => {
      expect(jsDocs.ParsedExamples.length).toEqual(3);
      const stringExampleNode = jsDocs.ParsedExamples[0];
      const retrieveStringExample = extractJSDocExamples(stringExampleNode, {
        kind: TypeKind.STRING
      });
      expect(retrieveStringExample).toBeDefined();
      expect(retrieveStringExample!.isOk).toBeTruthy();
      expect(retrieveStringExample!.unwrapOrThrow()).toStrictEqual([
        { name: "property-example", value: "property-example-value" }
      ]);
    });

    test("successfully parses integer examples on properties on type ParsedExamples", () => {
      expect(jsDocs.ParsedExamples.length).toEqual(3);
      const integerExampleNode = jsDocs.ParsedExamples[1];
      const retrieveIntegerExample = extractJSDocExamples(integerExampleNode, {
        kind: TypeKind.INT32
      });
      expect(retrieveIntegerExample).toBeDefined();
      expect(retrieveIntegerExample!.isOk).toBeTruthy();
      expect(retrieveIntegerExample!.unwrapOrThrow()).toStrictEqual([
        { name: "property-example-one", value: 123 },
        { name: "property-example-two", value: 456 }
      ]);
    });

    test("successfully parses boolean examples on properties on type ParsedExamples", () => {
      expect(jsDocs.ParsedExamples.length).toEqual(3);
      const booleanExampleNode = jsDocs.ParsedExamples[2];
      const retrieveBooleanExample = extractJSDocExamples(booleanExampleNode, {
        kind: TypeKind.BOOLEAN
      });
      expect(retrieveBooleanExample).toBeDefined();
      expect(retrieveBooleanExample!.isOk).toBeTruthy();
      expect(retrieveBooleanExample!.unwrapOrThrow()).toStrictEqual([
        { name: "property-example", value: false }
      ]);
    });

    test("errors examples on properties on type MismatchedExampleAndIntegerType", () => {
      expect(jsDocs.MismatchedExampleAndIntegerType.length).toEqual(1);
      const integerExampleNode = jsDocs.MismatchedExampleAndIntegerType[0];
      expect(
        extractJSDocExamples(integerExampleNode, {
          kind: TypeKind.INT32
        })!.unwrapErrOrThrow().message
      ).toEqual("could not parse example");
    });

    test("errors examples on properties on type MismatchedExampleAndStringWithQuotesType", () => {
      expect(jsDocs.MismatchedExampleAndStringWithQuotesType.length).toEqual(1);
      const stringExampleNode =
        jsDocs.MismatchedExampleAndStringWithQuotesType[0];
      expect(
        extractJSDocExamples(stringExampleNode, {
          kind: TypeKind.STRING
        })!.unwrapErrOrThrow().message
      ).toEqual("string examples must be quoted");
    });
  });
});
