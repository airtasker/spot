import { uniq } from "lodash";
import { TypeNode } from "../../models/nodes";
import {
  DataType,
  isReferenceType,
  isUnionType,
  TypeKind
} from "../../models/types";

/**
 * Root kinds include all kinds except for unions and type references.
 *
 * @param dataType
 * @param typeStore
 */
export function possibleRootKinds(
  dataType: DataType,
  typeStore: TypeNode[]
): TypeKind[] {
  if (isReferenceType(dataType)) {
    const referenceTypeNode = typeStore.find(
      type => type.name === dataType.name
    );
    if (!referenceTypeNode) {
      throw new Error(`Type store does not contain type: ${dataType.name}`);
    }
    return uniq(possibleRootKinds(referenceTypeNode.type, typeStore));
  } else if (isUnionType(dataType)) {
    return uniq(
      dataType.types.reduce<TypeKind[]>(
        (typeKindAcc, type) =>
          typeKindAcc.concat(possibleRootKinds(type, typeStore)),
        []
      )
    );
  } else {
    return [dataType.kind];
  }
}
