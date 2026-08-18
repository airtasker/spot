import * as os from "os";
import * as path from "path";
import { resolveOutputPath } from "./output";

describe("resolveOutputPath", () => {
  test("resolves a relative directory against the working directory", () => {
    expect(resolveOutputPath("doc/output", "api.yml")).toBe(
      path.join(process.cwd(), "doc/output/api.yml")
    );
  });

  test("keeps an absolute directory", () => {
    expect(resolveOutputPath("/srv/contracts", "api.yml")).toBe(
      "/srv/contracts/api.yml"
    );
  });

  test("expands a tilde against the home directory of this process", () => {
    // Not the caller's home, when Spot is a container: the one reported here
    // is the container's, which is why the path is worth printing at all.
    expect(resolveOutputPath("~/contracts", "api.yml")).toBe(
      path.join(os.homedir(), "contracts/api.yml")
    );
  });
});
