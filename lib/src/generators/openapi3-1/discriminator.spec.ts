import {
  nullType,
  objectType,
  referenceType,
  stringLiteralType,
  stringType,
  TypeTable,
  unionType
} from "../../types";
import {
  discriminatedLeafReferences,
  discriminatorMapping
} from "./discriminator";

// The parser gives no discriminator to a union that reaches a leaf twice or
// whose leaves share a value, so these shapes are built by hand.
describe("discriminated union flattening", () => {
  const tagged = (name: string, value: string) => ({
    name,
    typeDef: {
      type: objectType([
        { name: "type", type: stringLiteralType(value), optional: false }
      ])
    }
  });
  const union = (name: string, members: string[]) => ({
    name,
    typeDef: {
      type: unionType(
        members.map(m => referenceType(m)),
        "type"
      )
    }
  });
  const typeTable = TypeTable.fromArray([
    tagged("A", "a"),
    tagged("B", "b"),
    tagged("C", "c"),
    tagged("AlsoA", "a"),
    union("Left", ["A", "B"]),
    union("Right", ["A", "C"]),
    union("Ping", ["A", "Pong"]),
    union("Pong", ["B", "Ping"]),
    { name: "SelfAlias", typeDef: { type: referenceType("OtherAlias") } },
    { name: "OtherAlias", typeDef: { type: referenceType("SelfAlias") } }
  ]);
  const names = (member: Parameters<typeof discriminatedLeafReferences>[0]) =>
    discriminatedLeafReferences(member, typeTable).leaves.map(l => l.name);

  test("a leaf reached twice is listed once, where it is first seen", () => {
    expect(
      names(unionType([referenceType("Left"), referenceType("Right")]))
    ).toEqual(["A", "B", "C"]);
  });

  test("a cycle of unions terminates", () => {
    expect(names(referenceType("Ping"))).toEqual(["A", "B"]);
  });

  test("a union reached twice is expanded once", () => {
    expect(
      names(unionType([referenceType("Left"), referenceType("Left")]))
    ).toEqual(["A", "B"]);
  });

  test("a reference that is not to a union is its own leaf", () => {
    expect(discriminatedLeafReferences(referenceType("A"), typeTable)).toEqual({
      leaves: [referenceType("A")],
      nullable: false
    });
  });

  test("a null member is reported as nullable", () => {
    expect(
      discriminatedLeafReferences(
        unionType([referenceType("A"), nullType()]),
        typeTable
      )
    ).toEqual({ leaves: [referenceType("A")], nullable: true });
  });

  test("an alias cycle is rejected", () => {
    expect(() =>
      discriminatedLeafReferences(referenceType("SelfAlias"), typeTable)
    ).toThrow("Unexpected error: the type SelfAlias is an alias of itself");
  });

  test("a member that is neither a reference nor a union is rejected", () => {
    expect(() => discriminatedLeafReferences(stringType(), typeTable)).toThrow(
      "Unexpected error: a discriminated union member to flatten must be a reference or a union, not string"
    );
  });

  test("an inline member of the flattened union is rejected", () => {
    expect(() =>
      discriminatedLeafReferences(
        unionType([referenceType("A"), stringType()]),
        typeTable
      )
    ).toThrow(
      "The inline union has an inline string member, so the OpenAPI 3.1 generator cannot flatten it into a discriminated union. Declare the member as a named type."
    );
  });

  test("a value that maps to two leaves is rejected", () => {
    expect(() =>
      discriminatorMapping(
        [referenceType("A"), referenceType("AlsoA")],
        "type",
        typeTable
      )
    ).toThrow(
      'Unexpected error: the discriminator value "a" of "type" maps to both #/components/schemas/A and #/components/schemas/AlsoA'
    );
  });
});
