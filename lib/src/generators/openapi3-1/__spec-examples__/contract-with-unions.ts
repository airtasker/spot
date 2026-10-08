import { api, body, endpoint, Int32, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class Unions {
  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

interface Cat {
  kind: "cat";
  meows: boolean;
}

interface Dog {
  kind: "dog";
  barks: boolean;
}

interface Bird {
  wings: Int32;
}

type Pet = Cat | Dog;

type MaybePet = Cat | Dog | null;

interface Choices {
  colour: "red" | "green";
  pet: Cat | Dog;
}

interface Body {
  literals: "a" | "b";
  nullableLiterals: "a" | "b" | null;
  mixed: String | Int32 | boolean;
  nullableMixed: String | Int32 | null;
  discriminated: Cat | Dog;
  nullableDiscriminated: Cat | Dog | null;
  inlineDiscriminated: { kind: "cat" } | { kind: "dog" };
  undiscriminated: Cat | Bird;
  nullableUndiscriminated: Cat | Bird | null;
  undiscriminatedWithNullableMember: Bird | MaybePet | null;
  pet: Pet;
  maybePet: MaybePet;
  // A union of one type and null: the inferred discriminator is ignored.
  catOrNull: Cat | null;
  inlineLiteralUnionOrNull: Choices["colour"] | null;
  inlineDiscriminatedUnionOrNull: Choices["pet"] | null;
}
