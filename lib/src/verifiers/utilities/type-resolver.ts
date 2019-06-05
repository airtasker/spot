import { uniq } from "lodash";
import { TypeNode } from "../../models/nodes";
import {
  DataType,
  isReferenceType,
  isUnionType,
  NotReferenceTypeKind,
  ReferenceType
} from "../../models/types";

/**
 * Root kinds include all kinds except for unions and type references.
 *
 * @param dataType a data type
 * @param typeStore collection of type references for lookup
 */
export function possibleRootKinds(
  dataType: DataType,
  typeStore: TypeNode[]
): NotReferenceTypeKind[] {
  const resolvedType = resolveType(dataType, typeStore);
  if (isUnionType(resolvedType)) {
    return uniq(
      resolvedType.types.reduce<NotReferenceTypeKind[]>(
        (typeKindAcc, type) =>
          typeKindAcc.concat(possibleRootKinds(type, typeStore)),
        []
      )
    );
  } else {
    return [resolvedType.kind];
  }
}

/**
 * Resolves a type that may be a reference type to a non-reference type.
 *
 * @param dataType a data type
 * @param typeStore collection of type references for lookup
 */
export function resolveType(
  dataType: DataType,
  typeStore: TypeNode[]
): Exclude<DataType, ReferenceType> {
  if (isReferenceType(dataType)) {
    // A reference type is resolved to the referenced type.
    const referenceTypeNode = typeStore.find(
      type => type.name === dataType.name
    );
    if (!referenceTypeNode) {
      throw new Error(`Type store does not contain type: ${dataType.name}`);
    }
    return resolveType(referenceTypeNode.type, typeStore);
  } else if (isUnionType(dataType) && dataType.types.length === 1) {
    // A union type with a single type is resolved to the type itself.
    return resolveType(dataType.types[0], typeStore);
  } else {
    return dataType;
  }
}
