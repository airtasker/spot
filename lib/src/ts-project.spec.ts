import { createContractProject } from "./ts-project";

describe("createContractProject", () => {
  it("type-checks a contract that imports a node builtin", () => {
    // TypeScript 6 stopped pulling in `node_modules/@types` on its own, so the
    // types a contract can rely on are only the ones `contractCompilerOptions`
    // names. Without `types: ["node"]` this reports "Cannot find name 'path'" —
    // it still parses, it stops type-checking. `typeRoots` is not pinned here:
    // this passes under the default roots too, because the repository root has
    // a `node_modules`. The parity job's self-containment case is what covers
    // that half.
    const project = createContractProject();
    project.createSourceFile(
      "contract.ts",
      'import * as path from "path";\n' +
        'export const prefix: string = path.join("/", "v1");\n'
    );

    expect(
      project
        .getPreEmitDiagnostics()
        .map(diagnostic => diagnostic.getMessageText())
    ).toEqual([]);
  });
});
