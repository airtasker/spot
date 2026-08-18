import { READY_LINE_PREFIX } from "./validation-server";

describe("validation-server", () => {
  test("the readiness prefix downstream builds block on is unchanged", () => {
    // A rename otherwise passes review and CI here, and surfaces as a
    // timed-out build in another repository with nothing pointing back here.
    expect(READY_LINE_PREFIX).toBe("Validation server running");
  });
});
