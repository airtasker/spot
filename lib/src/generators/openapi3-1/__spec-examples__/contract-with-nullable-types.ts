import {
  api,
  body,
  Date,
  DateTime,
  Double,
  endpoint,
  Float,
  Int32,
  Int64,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class NullableTypes {
  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

interface Body {
  boolean: boolean | null;
  string: String | null;
  date: Date | null;
  dateTime: DateTime | null;
  float: Float | null;
  double: Double | null;
  int32: Int32 | null;
  int64: Int64 | null;
  stringLiteral: "one" | null;
  intLiteral: 1 | null;
  booleanLiteral: true | null;
  stringLiterals: "one" | "two" | null;
  intLiterals: 1 | 2 | null;
  object: { name: String } | null;
  array: String[] | null;
  arrayOfNullable: Array<String | null>;
}
