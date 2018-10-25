import * as fs from "fs-extra";
import * as path from "path";

export function outputFile(outDir: string, relativePath: string, content: string, override = true): boolean {
  const destinationPath = path.join(outDir, relativePath);
  fs.mkdirpSync(path.dirname(destinationPath));
  if (!override && fs.existsSync(destinationPath)) {
    // Skip.
    return false;
  }
  fs.writeFileSync(destinationPath, content, "utf8");
  return true
}
