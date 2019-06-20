import { flatten, negate } from "lodash";
import { extractEndpointTypes } from "../../utilities/extract-endpoint-types";
import { extractNestedUnionTypes } from "../../utilities/extract-union-types";
import { inferDiscriminator } from "../../utilities/infer-discriminator";
import { isUnionOfSingleTypeWithNull } from "../../utilities/nullable-type";
import { isUnionOfStringLiterals } from "../../utilities/string-literals-union";
import { LintingRule } from "../rule";

/**
 * Checks that all union types have a discriminator.
 */
export const hasDiscriminator: LintingRule = contract => {
  const topLevelTypes = flatten([
    ...contract.types,
    ...contract.endpoints.map(extractEndpointTypes)
  ]);
  const unionTypes = flatten(
    topLevelTypes.map(t => extractNestedUnionTypes(t.type, t.name))
  );
  return unionTypes
    .filter(negate(isUnionOfSingleTypeWithNull))
    .filter(negate(isUnionOfStringLiterals))
    .filter(
      typeNode => inferDiscriminator(contract.types, typeNode.type) === null
    )
    .map(typeNode => ({
      message: `The type \`${typeNode.name}\` doesn't have a discriminator`
    }));
};
