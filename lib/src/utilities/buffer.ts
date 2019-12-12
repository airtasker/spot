export function ensureBuffer(stringOrBuffer: string | Buffer) {
  return typeof stringOrBuffer === "string"
    ? Buffer.from(stringOrBuffer, "utf8")
    : stringOrBuffer;
}
