import fs from "fs-extra";
import path from "path";
import expandPathWithTilde from '../utilities/expand-path-with-tilde';

export function outputFile(
  outDir: string,
  relativePath: string,
  content: string,
  override = true
): boolean {
  const destinationPath = path.join(expandPathWithTilde(outDir), relativePath);
  fs.mkdirpSync(path.dirname(destinationPath));
  if (!override && fs.existsSync(destinationPath)) {
    // Skip.
    return false;
  }
  fs.writeFileSync(destinationPath, content, "utf8");
  return true;
}
