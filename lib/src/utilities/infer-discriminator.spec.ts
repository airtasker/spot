import { TypeDefinition } from "../models/definitions";
import { DataType, objectType, referenceType, stringLiteral, TypeKind, unionType } from "../models/types";
import { inferDiscriminator } from "./infer-discriminator";

describe("inferDiscriminator", () => {
  test("union of types with a valid discriminator", () => {
    const types: TypeDefinition[] = [
      {
        name: "Type1",
        type: objectType([
          {
            name: "name",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          },
          {
            name: "disc",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "type-1"
            }
          }
        ])
      },
      {
        name: "Type2",
        type: objectType([
          {
            name: "other",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          },
          {
            name: "disc",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "type-2"
            }
          }
        ])
      }
    ];
    const type = unionType([
      referenceType("Type1", "", TypeKind.OBJECT),
      referenceType("Type2", "", TypeKind.OBJECT)
    ]);
    expect(inferDiscriminator(types, type)).toEqual({
      propertyName: "disc",
      mapping: new Map<string, DataType>([
        ["type-1", referenceType("Type1", "", TypeKind.OBJECT)],
        ["type-2", referenceType("Type2", "", TypeKind.OBJECT)]
      ])
    });
  });

  test("union of types with a valid discriminator which is a type alias", () => {
    const types: TypeDefinition[] = [
      {
        name: "Type1",
        type: objectType([
          {
            name: "name",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          },
          {
            name: "disc",
            optional: false,
            type: {
              kind: TypeKind.TYPE_REFERENCE,
              name: "TypeDiscriminator1",
              referenceKind: TypeKind.STRING_LITERAL,
              location: ""
            }
          }
        ])
      },
      {
        name: "Type2",
        type: objectType([
          {
            name: "other",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          },
          {
            name: "disc",
            optional: false,
            type: {
              kind: TypeKind.TYPE_REFERENCE,
              name: "TypeDiscriminator2",
              referenceKind: TypeKind.STRING_LITERAL,
              location: ""
            }
          }
        ])
      },
      {
        name: "TypeDiscriminator1",
        type: stringLiteral("referenced-type-1")
      },
      {
        name: "TypeDiscriminator2",
        type: stringLiteral("referenced-type-2")
      }
    ];
    const type = unionType([
      referenceType("Type1", "", TypeKind.OBJECT),
      referenceType("Type2", "", TypeKind.OBJECT)
    ]);
    expect(inferDiscriminator(types, type)).toEqual({
      propertyName: "disc",
      mapping: new Map<string, DataType>([
        ["referenced-type-1", referenceType("Type1", "", TypeKind.OBJECT)],
        ["referenced-type-2", referenceType("Type2", "", TypeKind.OBJECT)]
      ])
    });
  });

  test("union of types with several valid discriminators", () => {
    const types: TypeDefinition[] = [
      {
        name: "Type1",
        type: objectType([
          {
            name: "name",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          },
          {
            name: "disc1",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "type-1"
            }
          },
          {
            name: "disc2",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "type-1"
            }
          }
        ])
      },
      {
        name: "Type2",
        type: objectType([
          {
            name: "other",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          },
          {
            name: "disc1",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "type-2"
            }
          },
          {
            name: "disc2",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "type-2"
            }
          }
        ])
      }
    ];
    const type = unionType([
      referenceType("Type1", "", TypeKind.OBJECT),
      referenceType("Type2", "", TypeKind.OBJECT)
    ]);
    expect(inferDiscriminator(types, type)).toEqual({
      propertyName: "disc1",
      mapping: new Map<string, DataType>([
        ["type-1", referenceType("Type1", "", TypeKind.OBJECT)],
        ["type-2", referenceType("Type2", "", TypeKind.OBJECT)]
      ])
    });
  });

  test("union of types with one discriminator that has conflicting values", () => {
    const types: TypeDefinition[] = [
      {
        name: "Type1",
        type: objectType([
          {
            name: "name",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          },
          {
            name: "disc1",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "conflict"
            }
          },
          {
            name: "disc2",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "type-1"
            }
          }
        ])
      },
      {
        name: "Type2",
        type: objectType([
          {
            name: "other",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          },
          {
            name: "disc1",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "conflict"
            }
          },
          {
            name: "disc2",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "type-2"
            }
          }
        ])
      }
    ];
    const type = unionType([
      referenceType("Type1", "", TypeKind.OBJECT),
      referenceType("Type2", "", TypeKind.OBJECT)
    ]);
    expect(inferDiscriminator(types, type)).toEqual({
      propertyName: "disc2",
      mapping: new Map<string, DataType>([
        ["type-1", referenceType("Type1", "", TypeKind.OBJECT)],
        ["type-2", referenceType("Type2", "", TypeKind.OBJECT)]
      ])
    });
  });

  test("union of types with where one of the discriminators is optional", () => {
    const types: TypeDefinition[] = [
      {
        name: "Type1",
        type: objectType([
          {
            name: "disc",
            optional: false,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "type-1"
            }
          }
        ])
      },
      {
        name: "Type2",
        type: objectType([
          {
            name: "disc",
            optional: true,
            type: {
              kind: TypeKind.STRING_LITERAL,
              value: "type-2"
            }
          }
        ])
      }
    ];
    const type = unionType([
      referenceType("Type1", "", TypeKind.OBJECT),
      referenceType("Type2", "", TypeKind.OBJECT)
    ]);
    expect(inferDiscriminator(types, type)).toBe(null);
  });

  test("union of inline object types", () => {
    const types: TypeDefinition[] = [];
    const inlineType1 = objectType([
      {
        name: "disc",
        optional: false,
        type: {
          kind: TypeKind.STRING_LITERAL,
          value: "type-1"
        }
      }
    ])
    const inlineType2 = objectType([
      {
        name: "disc",
        optional: false,
        type: {
          kind: TypeKind.STRING_LITERAL,
          value: "type-2"
        }
      }
    ])
    const type = unionType([inlineType1, inlineType2]);
    expect(inferDiscriminator(types, type)).toEqual({
      propertyName: "disc",
      mapping: new Map<string, DataType>([
        ["type-1", inlineType1],
        ["type-2", inlineType2]
      ])
    });
  });
});
