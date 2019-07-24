import os from 'os';

export default function expandPathWithTilde(path: string) {
  const homeDir = os.homedir();

  if (!homeDir) {
    return path;
  }

  return path.replace(/^~(?=\/|\\)/, homeDir);
}
