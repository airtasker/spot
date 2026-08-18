import { READY_LINE_PREFIX } from "./validation-server";

describe("validation-server", () => {
  test("the readiness prefix downstream builds block on is unchanged", () => {
    // Not a tautology: it is the only thing in this repository that fails when
    // the string is reworded. Without it a rename passes review and CI here,
    // and surfaces as a timed-out build in another repository with no
    // diagnostic pointing back at this line.
    expect(READY_LINE_PREFIX).toBe("Validation server running");
  });
});
