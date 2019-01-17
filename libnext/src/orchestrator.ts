import { parseFilePath } from "./parsers/parser";
import { verify } from "./verifiers/verifier";

// TODO: WIP
export function run(filePath: string) {
  const contract = parseFilePath(filePath);
  const errors = verify(contract);
  if (errors.length > 0) {
    throw new Error("errors exist");
  }
  // TODO: defluff the contract
}
