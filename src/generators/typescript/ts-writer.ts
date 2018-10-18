import ts from "typescript";

export function outputTypeScriptSource(statements: ts.Statement[]): string {
  const sourceFile = ts.createSourceFile(
    "source.ts",
    "",
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  );
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
  });
  return statements
    .map(s => printer.printNode(ts.EmitHint.Unspecified, s, sourceFile))
    .join("\n\n");
}
