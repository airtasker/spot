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
  test("an absolute relativePath wins over the output directory", () => {
    // This is what distinguishes path.resolve from path.join here. Every caller
    // today passes a bare filename, so the two agree; pinning it means a future
    // caller that passes an absolute path gets the decided behaviour rather than
    // whichever one happens to be in place.
    expect(resolveOutputPath("/srv/contracts", "/etc/spot/api.yml")).toBe(
      "/etc/spot/api.yml"
    );
  });
});
