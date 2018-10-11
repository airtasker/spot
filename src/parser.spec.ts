import * as fs from "fs-extra";
import * as path from "path";
import { parse } from "./parser";

describe("Parser", () => {
  it("produces the expected output for example API definition", async () => {
    const source = await fs.readFile(
      path.join(__dirname, "..", "example.ts"),
      "utf8"
    );
    let parsedApi = await parse(source);
    expect(parsedApi).toMatchSnapshot();
  });
});
