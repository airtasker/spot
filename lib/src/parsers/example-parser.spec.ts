import { extractJSDocExamples } from "./example-parser";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import {
  getJsDoc,
  parseTypeReferencePropertySignaturesOrThrow
} from "./parser-helpers";
import { JSDoc, PropertySignature } from "ts-morph";
import { TypeKind } from "../types";

function getJsDocsFromPropertySignatures(
  propertySignatures: PropertySignature[],
  propertyName: string
): JSDoc {
  const property = propertySignatures.find(p => p.getName() === propertyName);
  if (!property) {
    throw new Error(`PropertySignature "${propertyName}" not found`);
  }
  const jsDocNode = getJsDoc(property);
  if (jsDocNode === undefined)
    throw new Error(`JSDoc not found on property "${propertyName}"`);
  return jsDocNode;
}

describe("example-parser", () => {
  describe("extractJSDocExamples", () => {
    const sourceFile = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/examples.ts`
    ).file;
    const typeAlias = sourceFile.getTypeAlias("ExampleTests");
    if (!typeAlias) {
      throw new Error('TypeAlias "ExampleTests" not found');
    }
    const properties = parseTypeReferencePropertySignaturesOrThrow(
      typeAlias.getTypeNodeOrThrow()
    );

    test("successfully parses string examples on properties on type ParsedExamples", () => {
      const stringExampleNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-example"'
      );
      const retrieveStringExample = extractJSDocExamples(stringExampleNode, {
        kind: TypeKind.STRING
      });
      expect(retrieveStringExample.isOk()).toBeTruthy();
      expect(retrieveStringExample.unwrapOrThrow()).toStrictEqual([
        { name: "property-example", value: "property-example-value" }
      ]);
    });

    test("successfully parses integer examples on properties on type ParsedExamples", () => {
      const integerExampleNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-examples"'
      );
      const retrieveIntegerExample = extractJSDocExamples(integerExampleNode, {
        kind: TypeKind.INT32
      });
      expect(retrieveIntegerExample.isOk()).toBeTruthy();
      expect(retrieveIntegerExample.unwrapOrThrow()).toStrictEqual([
        { name: "property-example-one", value: 123 },
        { name: "property-example-two", value: 456 }
      ]);
    });

    test("successfully parses boolean examples on properties on type ParsedExamples", () => {
      const booleanExampleNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-boolean"'
      );
      const retrieveBooleanExample = extractJSDocExamples(booleanExampleNode, {
        kind: TypeKind.BOOLEAN
      });
      expect(retrieveBooleanExample.isOk()).toBeTruthy();
      expect(retrieveBooleanExample.unwrapOrThrow()).toStrictEqual([
        { name: "property-example", value: false }
      ]);
    });

    test("errors examples on properties on type MismatchedExampleAndIntegerType", () => {
      const integerExampleNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-mistyped-example"'
      );
      expect(
        extractJSDocExamples(integerExampleNode, {
          kind: TypeKind.INT32
        }).unwrapErrOrThrow().message
      ).toEqual("could not parse example");
    });

    test("errors examples on properties on type MismatchedExampleAndStringWithQuotesType", () => {
      const stringExampleNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-no-string-in-quotes"'
      );
      expect(
        extractJSDocExamples(stringExampleNode, {
          kind: TypeKind.STRING
        }).unwrapErrOrThrow().message
      ).toEqual("string examples must be quoted");
    });
  });
});
