import { uniq } from "lodash";
import { ContractNode } from "../../models/nodes";
import { VerificationError } from "../verification-error";

export function verifyUniqueTypeNames(
  contract: ContractNode
): VerificationError[] {
  const errors: VerificationError[] = [];
  const typeNames = contract.types.map(type => type.name);
  if (uniq(typeNames).length !== typeNames.length) {
    errors.push({
      message: "types must have unique names",
      // TODO: use a duplicated type location
      location: contract.api.location,
      line: contract.api.line
    });
  }
  return errors;
}
