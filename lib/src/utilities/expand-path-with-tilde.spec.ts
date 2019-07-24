import os from "os";
import expandPathWithTilde from "./expand-path-with-tilde";

describe("Expand tilde", () => {
  it("expands path with tilde to home directory", () => {
    expect(expandPathWithTilde("~/test/dir")).toBe(`${os.homedir()}/test/dir`);
  });

  it("does not expand path with tilde if not prefixed properly", () => {
    expect(expandPathWithTilde("~test/dir")).toBe(`~test/dir`);
  });

  it("does not expand path with no tilde", () => {
    expect(expandPathWithTilde("./test/dir")).toBe(`./test/dir`);
  });
});
