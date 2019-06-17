import { TypeDefinition } from "../models/definitions";
import { TypeKind, UnionType, ReferenceType, DataType } from "../models/types";
import { resolveType } from "../verifiers/utilities/type-resolver";

export interface UnionDiscriminator {
  propertyName: string;
  mapping: Map<DiscriminatorValue, DataType>;
}

export type DiscriminatorValue = string;

export function inferDiscriminator(
  types: TypeDefinition[],
  type: UnionType
): UnionDiscriminator | null {
  // To infer the discriminator, we do the following:
  // - loop through each type in the union
  // - look for required properties that are string literals (constants)
  // - if there's such a property that is defined for every type and has a different value
  //   for each type, then this is a good discriminator.
  const possibleDiscriminators: {
    [propertyName: string]: Map<DiscriminatorValue, DataType>;
  } = {};
  for (const possibleType of type.types) {
    const referencedType = resolveType(possibleType, types)
    if (referencedType.kind !== TypeKind.OBJECT) {
      // Referenced type isn't an object type, therefore it cannot have a discriminator property.
      return null;
    }
    for (const property of referencedType.properties) {
      if (property.optional) {
        // Optional properties cannot be discriminators, since they may not always be present.
        continue;
      }
      const resolvedPropertyType = resolveType(property.type, types);
      if (resolvedPropertyType.kind === TypeKind.STRING_LITERAL) {
        possibleDiscriminators[property.name] =
          possibleDiscriminators[property.name] || new Map();
        possibleDiscriminators[property.name].set(
          resolvedPropertyType.value,
          possibleType
        );
      }
    }
  }
  for (const [propertyName, mapping] of Object.entries(
    possibleDiscriminators
  )) {
    if (mapping.size === type.types.length) {
      // We have a valid discriminator, yay!
      return {
        propertyName,
        mapping
      };
    }
  }
  // No discriminator found.
  return null;
}
