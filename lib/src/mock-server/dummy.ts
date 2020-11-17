import assertNever from "assert-never";
import { generate as generateRandomString } from "randomstring";
import { Type, TypeKind, TypeTable } from "../types";

/**
 * Generates dummy data based on a type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateData(types: TypeTable, type: Type): any {
  switch (type.kind) {
    case TypeKind.NULL:
      return null;
    case TypeKind.BOOLEAN:
      return randomBoolean();
    case TypeKind.BOOLEAN_LITERAL:
      return type.value;
    case TypeKind.STRING:
      return generateRandomString();
    case TypeKind.STRING_LITERAL:
      return type.value;
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
      return randomDouble(100);
    case TypeKind.INT32:
      return randomInteger(100);
    case TypeKind.INT64:
      return Math.pow(2, 50) + randomInteger(10000);
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
      return new Date().toISOString();
    case TypeKind.INT_LITERAL:
    case TypeKind.FLOAT_LITERAL:
      return type.value;
    case TypeKind.OBJECT:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return type.properties.reduce<{ [key: string]: any }>((acc, property): {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      } => {
        if (randomBoolean() || !property.optional) {
          acc[property.name] = generateData(types, property.type);
        }
        return acc;
      }, {});
    case TypeKind.ARRAY: {
      const size = randomInteger(10);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const array: any[] = [];
      for (let i = 0; i < size; i++) {
        array.push(generateData(types, type.elementType));
      }
      return array;
    }
    case TypeKind.INTERSECTION:
      return type.types.map(type => generateData(types, type));
    case TypeKind.UNION:
      return generateData(
        types,
        type.types[randomInteger(type.types.length - 1)]
      );
    case TypeKind.REFERENCE: {
      const referencedType = types.get(type.name)?.type;
      if (!referencedType) {
        throw new Error(`Missing referenced type: ${type.name}`);
      }
      return generateData(types, referencedType);
    }
    default:
      throw assertNever(type);
  }
}

function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

function randomInteger(max: number): number {
  return Math.round(randomDouble(max));
}

function randomDouble(max: number): number {
  return Math.random() * max;
}
