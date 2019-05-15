import { groupBy, keys, pickBy } from "lodash";
import { ContractNode } from "../../models/nodes";
import { VerificationError } from "../verification-error";

export function verifyUniqueTypeNames(
  contract: ContractNode
): VerificationError[] {
  const errors: VerificationError[] = [];

  const typesByName = groupBy(contract.types, type => type.name);
  const duplicatedTypes = pickBy(
    typesByName,
    typeCollection => typeCollection.length > 1
  );

  keys(duplicatedTypes).forEach(typeName => {
    errors.push({
      message: `types must have unique names: ${typeName}`,
      // TODO: use a duplicated type location
      location: contract.api.location,
      line: contract.api.line
    });
  });

  return errors;
}
