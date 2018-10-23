import {
  arrayType,
  BOOLEAN,
  booleanConstant,
  integerConstant,
  NULL,
  NUMBER,
  objectType,
  optionalType,
  STRING,
  stringConstant,
  typeReference,
  unionType,
  VOID
} from "../../models";
import { FLAVOURS, jsonSchema } from "./json-schema";

describe("JSON Schema generator", () => {
  describe("generates type validator", () => {
    for (const flavour of FLAVOURS) {
      test(`${flavour} - void`, () => {
        expect(jsonSchema(flavour, VOID)).toMatchSnapshot();
      });

      test(`${flavour} - null`, () => {
        expect(jsonSchema(flavour, NULL)).toMatchSnapshot();
      });

      test(`${flavour} - boolean`, () => {
        expect(jsonSchema(flavour, BOOLEAN)).toMatchSnapshot();
      });

      test(`${flavour} - boolean constant`, () => {
        expect(jsonSchema(flavour, booleanConstant(true))).toMatchSnapshot();
        expect(jsonSchema(flavour, booleanConstant(false))).toMatchSnapshot();
      });

      test(`${flavour} - string`, () => {
        expect(jsonSchema(flavour, STRING)).toMatchSnapshot();
      });

      test(`${flavour} - string constant`, () => {
        expect(
          jsonSchema(flavour, stringConstant("some constant"))
        ).toMatchSnapshot();
      });

      test(`${flavour} - number`, () => {
        expect(jsonSchema(flavour, NUMBER)).toMatchSnapshot();
      });

      test(`${flavour} - integer constant`, () => {
        expect(jsonSchema(flavour, integerConstant(0))).toMatchSnapshot();
        expect(jsonSchema(flavour, integerConstant(123))).toMatchSnapshot();
        expect(jsonSchema(flavour, integerConstant(-1000))).toMatchSnapshot();
      });

      test(`${flavour} - object`, () => {
        expect(jsonSchema(flavour, objectType({}))).toMatchSnapshot();
        expect(
          jsonSchema(
            flavour,
            objectType({
              singleField: NUMBER
            })
          )
        ).toMatchSnapshot();
        expect(
          jsonSchema(
            flavour,
            objectType({
              field1: NUMBER,
              field2: STRING,
              field3: optionalType(BOOLEAN)
            })
          )
        ).toMatchSnapshot();
      });

      test(`${flavour} - array`, () => {
        expect(jsonSchema(flavour, arrayType(STRING))).toMatchSnapshot();
      });

      test(`${flavour} - optional`, () => {
        expect(() => jsonSchema(flavour, optionalType(STRING))).toThrowError(
          "Unsupported top-level optional type"
        );
      });

      test(`${flavour} - union`, () => {
        expect(
          jsonSchema(flavour, unionType(STRING, NUMBER, BOOLEAN))
        ).toMatchSnapshot();
      });

      test(`${flavour} - type reference`, () => {
        expect(
          jsonSchema(flavour, typeReference("OtherType"))
        ).toMatchSnapshot();
      });
    }
  });
});
