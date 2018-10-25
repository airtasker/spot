// Equivalent to https://github.com/aikoven/assert-never.
// Unfortunately importing it from node_modules causes issues.
export default function assertNever(value: never): never {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
}
