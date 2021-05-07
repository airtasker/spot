import { extractJSDocSchemaProps } from "./schemaprop-parser";
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
): JSDoc | undefined {
  const property = propertySignatures.find(p => p.getName() === propertyName);
  if (!property) {
    throw new Error(`PropertySignature "${propertyName}" not found`);
  }
  return getJsDoc(property);
}

describe("schemaprop-parser", () => {
  describe("extractJSDocSchemaProps", () => {
    const sourceFile = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/schemaprops.ts`
    ).file;
    const typeAlias = sourceFile.getTypeAlias("SchemaPropTests");
    if (!typeAlias) {
      throw new Error('TypeAlias "SchemaPropTests" not found');
    }
    const properties = parseTypeReferencePropertySignaturesOrThrow(
      typeAlias.getTypeNodeOrThrow()
    );

    test("successfully parses string schemaprops on properties on type ParsedSchemaProps", () => {
      const stringSchemaPropNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-schemaprop"'
      );
      const retrieveStringSchemaProp = extractJSDocSchemaProps(
        stringSchemaPropNode,
        {
          kind: TypeKind.STRING
        }
      );
      expect(retrieveStringSchemaProp).toBeDefined();
      expect(retrieveStringSchemaProp!.isOk).toBeTruthy();
      expect(retrieveStringSchemaProp!.unwrapOrThrow()).toStrictEqual([
        { name: "pattern", value: "property-schemaprop-value" }
      ]);
    });

    test("successfully parses integer schemaprops on properties on type ParsedSchemaProps", () => {
      const integerSchemaPropNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-schemaprops"'
      );
      const retrieveIntegerSchemaProp = extractJSDocSchemaProps(
        integerSchemaPropNode,
        {
          kind: TypeKind.INT32
        }
      );
      expect(retrieveIntegerSchemaProp).toBeDefined();
      expect(retrieveIntegerSchemaProp!.isOk).toBeTruthy();
      expect(retrieveIntegerSchemaProp!.unwrapOrThrow()).toStrictEqual([
        { name: "minimum", value: 123 },
        { name: "default", value: 456 }
      ]);
    });

    test("successfully parses boolean schemaprops on properties on type ParsedSchemaProps", () => {
      const booleanSchemaPropNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-boolean"'
      );
      const retrieveBooleanSchemaProp = extractJSDocSchemaProps(
        booleanSchemaPropNode,
        {
          kind: TypeKind.BOOLEAN
        }
      );
      expect(retrieveBooleanSchemaProp).toBeDefined();
      expect(retrieveBooleanSchemaProp!.isOk).toBeTruthy();
      expect(retrieveBooleanSchemaProp!.unwrapOrThrow()).toStrictEqual([
        { name: "example", value: false }
      ]);
    });

    test("successfully parses date schemaprops on properties on type ParsedSchemaProps", () => {
      const booleanSchemaPropNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-date"'
      );
      const retrieveBooleanSchemaProp = extractJSDocSchemaProps(
        booleanSchemaPropNode,
        {
          kind: TypeKind.DATE
        }
      );
      expect(retrieveBooleanSchemaProp).toBeDefined();
      expect(retrieveBooleanSchemaProp!.isOk).toBeTruthy();
      expect(retrieveBooleanSchemaProp!.unwrapOrThrow()).toStrictEqual([
        { name: "example", value: "1990-12-31" }
      ]);
    });

    test("errors schemaprops on properties on type MismatchedSchemaPropAndIntegerType", () => {
      const integerSchemaPropNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-mistyped-schemaprop"'
      );
      expect(
        extractJSDocSchemaProps(integerSchemaPropNode, {
          kind: TypeKind.INT32
        })!.unwrapErrOrThrow().message
      ).toEqual("could not parse schemaProp");
    });

    test("errors schemaprops on properties on type MismatchedSchemaPropAndStringWithQuotesType", () => {
      const stringSchemaPropNode = getJsDocsFromPropertySignatures(
        properties,
        '"property-with-no-string-in-quotes"'
      );
      expect(
        extractJSDocSchemaProps(stringSchemaPropNode, {
          kind: TypeKind.STRING
        })!.unwrapErrOrThrow().message
      ).toEqual("example schemaProp must be quoted");
    });
  });
});
