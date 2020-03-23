import os from "os";

export function expandPathWithTilde(path: string): string {
  const homeDir = os.homedir();

  if (!homeDir) {
    return path;
  }

  return path.replace(/^~(?=\/|\\)/, homeDir);
}
