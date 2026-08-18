import fs from "fs-extra";
import path from "path";
import { expandPathWithTilde } from "../utilities/expand-path-with-tilde";

/**
 * Where `outputFile` writes, as an absolute path.
 *
 * Worth reporting to the user rather than echoing back what they typed: `~`
 * expands against the home directory of whatever is running Spot, which under
 * a container is the container's, not theirs.
 */
export function resolveOutputPath(
  outDir: string,
  relativePath: string
): string {
  return path.resolve(expandPathWithTilde(outDir), relativePath);
}

export function outputFile(
  outDir: string,
  relativePath: string,
  content: string,
  override = true
): boolean {
  const destinationPath = resolveOutputPath(outDir, relativePath);
  fs.mkdirpSync(path.dirname(destinationPath));
  if (!override && fs.existsSync(destinationPath)) {
    // Skip.
    return false;
  }
  fs.writeFileSync(destinationPath, content, "utf8");
  return true;
}
