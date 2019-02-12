import { DataExpression, TypeKind } from "../models/types";

export function valueFromDataExpression(data: DataExpression): any {
  switch (data.kind) {
    case TypeKind.NULL:
      return null;
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING_LITERAL:
    case TypeKind.NUMBER_LITERAL:
      return data.value;
    case TypeKind.ARRAY:
      return data.elements.reduce<Array<any>>(
        (arrayAcc, element) =>
          arrayAcc.concat(valueFromDataExpression(element)),
        []
      );
    case TypeKind.OBJECT:
      return data.properties.reduce<object>((objAcc, property) => {
        return {
          [property.name]: valueFromDataExpression(property.expression),
          ...objAcc
        };
      }, {});
    default:
      throw new Error("unexpected data expression");
  }
}
