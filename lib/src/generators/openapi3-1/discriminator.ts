import {
  dereferenceType,
  isObjectType,
  isStringLiteralType,
  possibleRootTypes,
  ReferenceType,
  Type,
  TypeKind,
  TypeTable
} from "../../types";

/**
 * The leaf references of a discriminated union member: each leaf is a
 * reference whose target is not a union, so it is where the discriminator
 * property is declared.
 *
 * A reference to a union is replaced by that union's leaves, recursively. A
 * `null` reached that way is reported as `nullable`, for the outer union to
 * carry, because a discriminated `oneOf` cannot have a `null` branch. Passing
 * a union rather than a reference flattens each of its members.
 *
 * Leaves keep the name the author referenced, so an alias of an object is a
 * leaf in its own right. Each union is expanded at most once, which also
 * stops a cycle of unions, and leaves are deduplicated by name, first seen
 * wins.
 */
export function discriminatedLeafReferences(
  member: Type,
  typeTable: TypeTable
): { leaves: ReferenceType[]; nullable: boolean } {
  const leaves = new Map<string, ReferenceType>();
  const expandedUnions = new Set<string>();
  let nullable = false;

  const visitUnionMembers = (members: Type[], union: string) => {
    members.forEach(inner => {
      if (inner.kind === TypeKind.NULL) {
        nullable = true;
      } else if (inner.kind === TypeKind.REFERENCE) {
        visitReference(inner);
      } else {
        throw new Error(
          `${union} has an inline ${inner.kind} member, so the OpenAPI 3.1 generator cannot list it in a discriminator mapping. Declare the member as a named type.`
        );
      }
    });
  };

  const visitReference = (reference: ReferenceType) => {
    const aliases = new Set<string>();
    let name = reference.name;
    let target = typeTable.getOrError(name).type;
    while (target.kind === TypeKind.REFERENCE) {
      aliases.add(name);
      name = target.name;
      if (aliases.has(name)) {
        throw new Error(
          `Unexpected error: the type ${reference.name} is an alias of itself`
        );
      }
      target = typeTable.getOrError(name).type;
    }

    if (target.kind === TypeKind.NULL) {
      nullable = true;
    } else if (target.kind === TypeKind.UNION) {
      if (!expandedUnions.has(name)) {
        expandedUnions.add(name);
        visitUnionMembers(target.types, `The union ${name}`);
      }
    } else if (!leaves.has(reference.name)) {
      leaves.set(reference.name, reference);
    }
  };

  switch (member.kind) {
    case TypeKind.REFERENCE:
      visitReference(member);
      break;
    case TypeKind.UNION:
      visitUnionMembers(member.types, "The inline union");
      break;
    default:
      throw new Error(
        `Unexpected error: a discriminated union member to flatten must be a reference or a union, not ${member.kind}`
      );
  }

  return { leaves: [...leaves.values()], nullable };
}

/**
 * Maps the discriminator value of each leaf to the leaf's `$ref`. An
 * intersection leaf is merged into one object to find the property.
 */
export function discriminatorMapping(
  leaves: ReferenceType[],
  propertyName: string,
  typeTable: TypeTable
): { [value: string]: string } {
  const mapping: { [value: string]: string } = {};
  leaves.forEach(leaf => {
    const [root] = possibleRootTypes(leaf, typeTable);
    const property = isObjectType(root)
      ? root.properties.find(p => p.name === propertyName)
      : undefined;
    const propertyType = property && dereferenceType(property.type, typeTable);
    if (propertyType === undefined || !isStringLiteralType(propertyType)) {
      throw new Error(
        `Unexpected error: the discriminator property "${propertyName}" of ${leaf.name} is not a string literal`
      );
    }
    const ref = schemaReference(leaf.name);
    const existing = mapping[propertyType.value];
    if (existing !== undefined && existing !== ref) {
      throw new Error(
        `Unexpected error: the discriminator value "${propertyType.value}" of "${propertyName}" maps to both ${existing} and ${ref}`
      );
    }
    mapping[propertyType.value] = ref;
  });
  return mapping;
}

export function schemaReference(name: string): string {
  return `#/components/schemas/${name}`;
}
