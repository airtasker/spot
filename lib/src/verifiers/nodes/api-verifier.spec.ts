import { ApiNode } from "../../models/nodes";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { verifyApiNode } from "./api-verifier";

describe("api node verifier", () => {
  test("valid for correct usage", () => {
    const apiNode: ApiNode = {
      name: fakeLocatable("somestring")
    };
    expect(verifyApiNode(apiNode, [])).toHaveLength(0);
  });

  test("invalid for incorrect usage", () => {
    const apiNode: ApiNode = {
      name: fakeLocatable("  somest*&^%$ring")
    };
    const errors = verifyApiNode(apiNode, []);
    expect(errors).toHaveLength(2);
    expect(errors).toContainEqual({
      message: "api name may not contain leading or trailing white space",
      location: "somelocation.ts",
      line: 4
    });
    expect(errors).toContainEqual({
      message:
        "api name may only contain alphanumeric, space, underscore and hyphen characters",
      location: "somelocation.ts",
      line: 4
    });
  });
});
