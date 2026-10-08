import {
  arrayType,
  booleanLiteralType,
  booleanType,
  dateTimeType,
  dateType,
  doubleType,
  floatLiteralType,
  floatType,
  int32Type,
  int64Type,
  intersectionType,
  intLiteralType,
  nullType,
  objectType,
  referenceType,
  stringLiteralType,
  stringType,
  Type,
  TypeTable,
  unionType,
  UnionType
} from "../../types";
import { SchemaObject } from "./openapi3-1-specification";
import { typeToSchemaObject } from "./openapi3-1-type-util";

describe("OpenAPI 3.1 type util", () => {
  describe("primitive and literal types", () => {
    it.each<[string, Type, SchemaObject]>([
      ["boolean", booleanType(), { type: "boolean" }],
      ["true", booleanLiteralType(true), { type: "boolean", enum: [true] }],
      ["false", booleanLiteralType(false), { type: "boolean", enum: [false] }],
      ["string", stringType(), { type: "string" }],
      [
        "string literal",
        stringLiteralType("value"),
        { type: "string", enum: ["value"] }
      ],
      ["Float", floatType(), { type: "number", format: "float" }],
      ["Double", doubleType(), { type: "number", format: "double" }],
      [
        "float literal",
        floatLiteralType(3.5),
        { type: "number", format: "float", enum: [3.5] }
      ],
      ["Int32", int32Type(), { type: "integer", format: "int32" }],
      ["Int64", int64Type(), { type: "integer", format: "int64" }],
      [
        "int literal",
        intLiteralType(4),
        { type: "integer", format: "int32", enum: [4] }
      ],
      ["Date", dateType(), { type: "string", format: "date" }],
      ["DateTime", dateTimeType(), { type: "string", format: "date-time" }]
    ])("%s", (_, type, expected) => {
      expect(typeToSchemaObject(type, new TypeTable())).toEqual(expected);
    });
  });

  describe("Object type", () => {
    test("converts to object schema", () => {
      const result = typeToSchemaObject(
        objectType([
          {
            name: "a",
            type: stringType(),
            optional: false,
            description: "description"
          },
          { name: "b", type: stringType(), optional: true }
        ]),
        new TypeTable()
      );
      expect(result).toEqual({
        type: "object",
        properties: {
          a: { type: "string", description: "description" },
          b: { type: "string" }
        },
        required: ["a"]
      });
    });

    test("omits properties and required when there are no properties", () => {
      expect(typeToSchemaObject(objectType([]), new TypeTable())).toEqual({
        type: "object"
      });
    });

    test("keeps a property description beside $ref", () => {
      const typeTable = new TypeTable();
      typeTable.add("CustomType", { type: stringType() });

      const result = typeToSchemaObject(
        objectType([
          {
            name: "a",
            type: referenceType("CustomType"),
            optional: false,
            description: "description"
          }
        ]),
        typeTable
      );
      expect(result).toEqual({
        type: "object",
        properties: {
          a: {
            $ref: "#/components/schemas/CustomType",
            description: "description"
          }
        },
        required: ["a"]
      });
    });
  });

  describe("Array type", () => {
    test("converts to array schema", () => {
      expect(
        typeToSchemaObject(arrayType(stringType()), new TypeTable())
      ).toEqual({
        type: "array",
        items: { type: "string" }
      });
    });
  });

  describe("Reference type", () => {
    test("converts to $ref", () => {
      const typeTable = new TypeTable();
      typeTable.add("CustomType", { type: stringType() });

      expect(
        typeToSchemaObject(referenceType("CustomType"), typeTable)
      ).toEqual({ $ref: "#/components/schemas/CustomType" });
    });
  });

  describe("Union of literals of one kind", () => {
    it.each<[string, Type, SchemaObject]>([
      [
        "true | false",
        unionType([booleanLiteralType(true), booleanLiteralType(false)]),
        { type: "boolean", enum: [true, false] }
      ],
      [
        '"one" | "two" | "three"',
        unionType([
          stringLiteralType("one"),
          stringLiteralType("two"),
          stringLiteralType("three")
        ]),
        { type: "string", enum: ["one", "two", "three"] }
      ],
      [
        "1.1 | 1.2 | 1.3",
        unionType([
          floatLiteralType(1.1),
          floatLiteralType(1.2),
          floatLiteralType(1.3)
        ]),
        { type: "number", format: "float", enum: [1.1, 1.2, 1.3] }
      ],
      [
        "1 | 2 | 3",
        unionType([intLiteralType(1), intLiteralType(2), intLiteralType(3)]),
        { type: "integer", format: "int32", enum: [1, 2, 3] }
      ]
    ])("%s", (_, type, expected) => {
      expect(typeToSchemaObject(type, new TypeTable())).toEqual(expected);
    });
  });

  describe("schemaprops", () => {
    test("are copied onto the schema", () => {
      const result = typeToSchemaObject(
        {
          ...stringType(),
          schemaProps: [
            { name: "title", value: "a title" },
            { name: "minLength", value: 2 }
          ]
        },
        new TypeTable()
      );
      expect(result).toEqual({
        type: "string",
        title: "a title",
        minLength: 2
      });
    });

    it.each(["example", "exclusiveMinimum", "exclusiveMaximum"])(
      "%s is rejected",
      name => {
        expect(() =>
          typeToSchemaObject(
            { ...int32Type(), schemaProps: [{ name, value: true }] },
            new TypeTable()
          )
        ).toThrow(
          `The "${name}" schemaprop is not supported by the OpenAPI 3.1 generator`
        );
      }
    );
  });

  describe("emission table", () => {
    const named = (name: string, type: Type) => ({ name, typeDef: { type } });
    const cat = objectType([
      { name: "kind", type: stringLiteralType("cat"), optional: false },
      { name: "meows", type: booleanType(), optional: false }
    ]);
    const dog = objectType([
      { name: "kind", type: stringLiteralType("dog"), optional: false }
    ]);
    const bird = objectType([
      { name: "wings", type: int32Type(), optional: false }
    ]);
    const typeTable = TypeTable.fromArray([
      named("Cat", cat),
      named("Dog", dog),
      named("Bird", bird),
      named("CatAlias", referenceType("Cat")),
      named("MaybeCat", unionType([referenceType("Cat"), nullType()])),
      named("MaybeCatAlias", referenceType("MaybeCat")),
      named(
        "CatAndBird",
        intersectionType([referenceType("Cat"), referenceType("Bird")])
      ),
      named(
        "Pet",
        unionType([referenceType("Cat"), referenceType("Dog")], "kind")
      ),
      named(
        "MaybePet",
        unionType(
          [referenceType("Cat"), referenceType("Dog"), nullType()],
          "kind"
        )
      ),
      named("Nothing", nullType())
    ]);
    const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
    const catAndDogOneOf: SchemaObject = {
      oneOf: [ref("Cat"), ref("Dog")],
      discriminator: {
        propertyName: "kind",
        mapping: {
          cat: "#/components/schemas/Cat",
          dog: "#/components/schemas/Dog"
        }
      }
    };

    it.each<[string, Type, SchemaObject]>([
      ["null on its own", nullType(), { type: "null" }],
      [
        "boolean | null",
        unionType([booleanType(), nullType()]),
        { type: ["boolean", "null"] }
      ],
      [
        "String | null",
        unionType([stringType(), nullType()]),
        { type: ["string", "null"] }
      ],
      [
        "Date | null",
        unionType([dateType(), nullType()]),
        { type: ["string", "null"], format: "date" }
      ],
      [
        "DateTime | null",
        unionType([dateTimeType(), nullType()]),
        { type: ["string", "null"], format: "date-time" }
      ],
      [
        "Float | null",
        unionType([floatType(), nullType()]),
        { type: ["number", "null"], format: "float" }
      ],
      [
        "Double | null",
        unionType([doubleType(), nullType()]),
        { type: ["number", "null"], format: "double" }
      ],
      [
        "Int32 | null",
        unionType([int32Type(), nullType()]),
        { type: ["integer", "null"], format: "int32" }
      ],
      [
        "Int64 | null",
        unionType([int64Type(), nullType()]),
        { type: ["integer", "null"], format: "int64" }
      ],
      [
        '"a" | null',
        unionType([stringLiteralType("a"), nullType()]),
        { type: ["string", "null"], enum: ["a", null] }
      ],
      [
        "1 | null",
        unionType([intLiteralType(1), nullType()]),
        { type: ["integer", "null"], format: "int32", enum: [1, null] }
      ],
      [
        '"a" | "b" | null',
        unionType([stringLiteralType("a"), stringLiteralType("b"), nullType()]),
        { type: ["string", "null"], enum: ["a", "b", null] }
      ],
      [
        "true | false | null",
        unionType([
          booleanLiteralType(true),
          booleanLiteralType(false),
          nullType()
        ]),
        { type: ["boolean", "null"], enum: [true, false, null] }
      ],
      [
        "object | null",
        unionType([bird, nullType()]),
        {
          type: ["object", "null"],
          properties: { wings: { type: "integer", format: "int32" } },
          required: ["wings"]
        }
      ],
      [
        "array | null",
        unionType([arrayType(stringType()), nullType()]),
        { type: ["array", "null"], items: { type: "string" } }
      ],
      [
        "reference | null",
        unionType([referenceType("Cat"), nullType()]),
        { anyOf: [ref("Cat"), { type: "null" }] }
      ],
      [
        "reference to an alias of an object | null",
        unionType([referenceType("CatAlias"), nullType()]),
        { anyOf: [ref("CatAlias"), { type: "null" }] }
      ],
      [
        "reference to a nullable union | null",
        unionType([referenceType("MaybeCat"), nullType()]),
        ref("MaybeCat")
      ],
      [
        "reference to an alias of a nullable union | null",
        unionType([referenceType("MaybeCatAlias"), nullType()]),
        ref("MaybeCatAlias")
      ],
      [
        "reference to null | null",
        unionType([referenceType("Nothing"), nullType()]),
        ref("Nothing")
      ],
      [
        "discriminated union of references",
        unionType([referenceType("Cat"), referenceType("Dog")], "kind"),
        catAndDogOneOf
      ],
      [
        "discriminated union of references | null",
        unionType(
          [referenceType("Cat"), referenceType("Dog"), nullType()],
          "kind"
        ),
        { anyOf: [catAndDogOneOf, { type: "null" }] }
      ],
      [
        "discriminated union with an intersection member",
        unionType([referenceType("CatAndBird"), referenceType("Dog")], "kind"),
        {
          oneOf: [ref("CatAndBird"), ref("Dog")],
          discriminator: {
            propertyName: "kind",
            mapping: {
              cat: "#/components/schemas/CatAndBird",
              dog: "#/components/schemas/Dog"
            }
          }
        }
      ],
      [
        "discriminated union with an inline member has no mapping",
        unionType([cat, referenceType("Dog")], "kind"),
        {
          oneOf: [typeToSchemaObject(cat, typeTable), ref("Dog")],
          discriminator: { propertyName: "kind" }
        }
      ],
      [
        "reference to an object with one literal | null ignores the discriminator",
        unionType([referenceType("Cat"), nullType()], "kind"),
        { anyOf: [ref("Cat"), { type: "null" }] }
      ],
      [
        "union without a discriminator",
        unionType([stringType(), int32Type(), booleanType()]),
        {
          oneOf: [
            { type: "string" },
            { type: "integer", format: "int32" },
            { type: "boolean" }
          ]
        }
      ],
      [
        "union of literals of different kinds",
        unionType([stringLiteralType("a"), intLiteralType(1)]),
        {
          oneOf: [
            { type: "string", enum: ["a"] },
            { type: "integer", format: "int32", enum: [1] }
          ]
        }
      ],
      [
        "union without a discriminator | null",
        unionType([referenceType("Cat"), referenceType("Bird"), nullType()]),
        { oneOf: [ref("Cat"), ref("Bird"), { type: "null" }] }
      ],
      [
        "union without a discriminator | null, with a member that admits null",
        unionType([
          referenceType("Bird"),
          referenceType("MaybePet"),
          nullType()
        ]),
        { oneOf: [ref("Bird"), ref("MaybePet")] }
      ],
      [
        "intersection",
        intersectionType([referenceType("Cat"), referenceType("Bird")]),
        { allOf: [ref("Cat"), ref("Bird")] }
      ],
      [
        "inline intersection | null",
        unionType([
          intersectionType([referenceType("Cat"), referenceType("Bird")]),
          nullType()
        ]),
        { anyOf: [{ allOf: [ref("Cat"), ref("Bird")] }, { type: "null" }] }
      ],
      [
        "reference to an intersection | null",
        unionType([referenceType("CatAndBird"), nullType()]),
        { anyOf: [ref("CatAndBird"), { type: "null" }] }
      ],
      [
        "inline union of literals | null",
        unionType([
          unionType([stringLiteralType("a"), stringLiteralType("b")]),
          nullType()
        ]),
        { type: ["string", "null"], enum: ["a", "b", null] }
      ],
      [
        "inline discriminated union | null",
        unionType([
          unionType([referenceType("Cat"), referenceType("Dog")], "kind"),
          nullType()
        ]),
        { anyOf: [catAndDogOneOf, { type: "null" }] }
      ],
      [
        "inline nullable union | null keeps a single null",
        unionType([
          unionType([stringLiteralType("a"), nullType()]),
          nullType()
        ]),
        { type: ["string", "null"], enum: ["a", null] }
      ],
      ["a single-member union", unionType([stringType()]), { type: "string" }],
      ["null | null", unionType([nullType(), nullType()]), { type: "null" }]
    ])("%s", (_, type, expected) => {
      expect(typeToSchemaObject(type, typeTable)).toEqual(expected);
    });

    it.each<[string, Type, string]>([
      [
        "a reference to another union",
        unionType([referenceType("Pet"), referenceType("Bird")], "kind"),
        "Pet"
      ],
      [
        "a reference to a nullable union",
        unionType([referenceType("MaybeCat"), referenceType("Dog")], "kind"),
        "MaybeCat"
      ],
      [
        "an inline union",
        unionType(
          [
            unionType([referenceType("Cat"), referenceType("Dog")], "kind"),
            referenceType("Bird")
          ],
          "kind"
        ),
        "an inline union"
      ]
    ])(
      "a discriminated union with %s as a member is rejected",
      (_, type, member) => {
        expect(() => typeToSchemaObject(type, typeTable)).toThrow(
          `A discriminated union with a member that resolves to another union (${member}) is not supported by the OpenAPI 3.1 generator`
        );
      }
    );

    describe("union-level schemaprops stay on the outer schema", () => {
      const title = { name: "title", value: "a title" };

      it.each<[string, UnionType, SchemaObject]>([
        [
          "widened type",
          unionType([stringType(), nullType()]),
          { type: ["string", "null"], title: "a title" }
        ],
        [
          "nullable reference",
          unionType([referenceType("Cat"), nullType()]),
          { anyOf: [ref("Cat"), { type: "null" }], title: "a title" }
        ],
        [
          "nullable discriminated union",
          unionType(
            [referenceType("Cat"), referenceType("Dog"), nullType()],
            "kind"
          ),
          { anyOf: [catAndDogOneOf, { type: "null" }], title: "a title" }
        ],
        [
          "union without a discriminator",
          unionType([stringType(), int32Type()]),
          {
            oneOf: [{ type: "string" }, { type: "integer", format: "int32" }],
            title: "a title"
          }
        ]
      ])("%s", (_, type, expected) => {
        expect(
          typeToSchemaObject({ ...type, schemaProps: [title] }, typeTable)
        ).toEqual(expected);
      });

      test("intersection", () => {
        expect(
          typeToSchemaObject(
            {
              ...intersectionType([
                referenceType("Cat"),
                referenceType("Bird")
              ]),
              schemaProps: [title]
            },
            typeTable
          )
        ).toEqual({ allOf: [ref("Cat"), ref("Bird")], title: "a title" });
      });
    });
  });
});
