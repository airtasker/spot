import os from 'os';

export default function expandPathWithTilde(path: string) {
  return path.replace(/^~(?=\/|\\)/, os.homedir());
}
