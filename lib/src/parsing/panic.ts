import ts from "typescript";

export function panic(nodeOrMessage: ts.Node | string) {
  if (typeof nodeOrMessage === "string") {
    return new Error(nodeOrMessage);
  }
  let syntaxKind = "unknown";
  for (const [key, value] of Object.entries(ts.SyntaxKind)) {
    if (nodeOrMessage.kind === value) {
      syntaxKind = key;
      break;
    }
  }
  return new Error(syntaxKind + ": " + JSON.stringify(nodeOrMessage, null, 2));
}
