import { JSDoc } from "ts-morph";
import { SchemaProp, Type, TypeKind } from "../types";
import { err, ok, Result } from "../util";
import { ParserError } from "../errors";

export function extractJSDocSchemaProps(
  jsDoc: JSDoc | undefined,
  type: Type
): Result<SchemaProp[], ParserError> | undefined {
  // return early if there is no jsDoc available
  if (!jsDoc) {
    return;
  }

  const rawDefaults = jsDoc
    .getTags()
    .filter(tag => tag.getTagName() === "default")
    .map(schemaProp => schemaProp.getComment());
  const parentJsDocNode = jsDoc.getParent();
  if (rawDefaults && rawDefaults.indexOf(undefined) !== -1) {
    return err(
      new ParserError("Default must not be empty", {
        file: parentJsDocNode.getSourceFile().getFilePath(),
        position: parentJsDocNode.getPos()
      })
    );
  }

  const rawSchemaProps = jsDoc
    .getTags()
    .filter(tag => tag.getTagName() === "oaSchemaProp")
    .map(schemaProp => schemaProp.getComment());
  if (rawSchemaProps && rawSchemaProps.indexOf(undefined) !== -1) {
    return err(
      new ParserError("schemaProp must not be empty", {
        file: parentJsDocNode.getSourceFile().getFilePath(),
        position: parentJsDocNode.getPos()
      })
    );
  }

  if (rawDefaults && rawDefaults.length > 0) {
    rawDefaults.every(defaultValue => {
      rawSchemaProps.push("default\n" + defaultValue);
    });
  }

  if (rawSchemaProps && rawSchemaProps.length > 0) {
    const schemaProps: SchemaProp[] = [];
    let schemaPropError;

    const typeSpecified: TypeKind | "number" =
      spotTypesToJSTypesMap.get(type.kind) || type.kind;

    let subTypeSpecified = typeSpecified;
    if (type.kind === TypeKind.UNION || type.kind === TypeKind.INTERSECTION) {
      const referenceType: TypeKind = type.types[0].kind;
      if (
        type.types.every(subType => {
          return subType.kind === referenceType;
        })
      ) {
        subTypeSpecified =
          spotTypesToJSTypesMap.get(referenceType) || referenceType;
      }
    }

    rawSchemaProps.every(schemaProp => {
      const schemaPropStr = schemaProp?.toString();
      const schemaPropName = schemaPropStr?.split("\n")[0]?.trim();
      const schemaPropValue = schemaPropStr?.split("\n")[1]?.trim();

      if (!schemaPropName || !schemaPropValue) {
        schemaPropError = err(
          new ParserError("malformed schemaProp", {
            file: parentJsDocNode.getSourceFile().getFilePath(),
            position: parentJsDocNode.getPos()
          })
        );
        return false;
      } else {
        if (schemaProps.some(ex => ex.name === schemaPropName)) {
          schemaPropError = err(
            new ParserError(
              "duplicate " + schemaPropName + " schemaProp name",
              {
                file: parentJsDocNode.getSourceFile().getFilePath(),
                position: parentJsDocNode.getPos()
              }
            )
          );
          return false;
        }

        if (
          (propTypeMap.get(schemaPropName)?.type === "string" ||
            (typeSpecified === TypeKind.STRING &&
              propTypeMap.get(schemaPropName)?.type === "any")) &&
          (!schemaPropValue.startsWith('"') || !schemaPropValue.endsWith('"'))
        ) {
          schemaPropError = err(
            new ParserError(schemaPropName + " schemaProp must be quoted", {
              file: parentJsDocNode.getSourceFile().getFilePath(),
              position: parentJsDocNode.getPos()
            })
          );
          return false;
        }

        try {
          const parsedValue = JSON.parse(schemaPropValue);
          schemaProps.push({ name: schemaPropName, value: parsedValue });
        } catch (e) {
          schemaPropError = err(
            new ParserError("could not parse schemaProp", {
              file: parentJsDocNode.getSourceFile().getFilePath(),
              position: parentJsDocNode.getPos()
            })
          );
          return false;
        }

        return true;
      }
    });
    if (schemaPropError) {
      return schemaPropError;
    }

    const nameSchemaProps: string[] = schemaProps.map(ex => {
      return ex.name;
    });

    if (
      nameSchemaProps.some(
        nameSchemaProp =>
          !propTypeMap
            .get(nameSchemaProp)
            ?.targetTypes.find(targetType => targetType === typeSpecified)
      )
    ) {
      return err(
        new ParserError(
          "property must be compliant with " +
            typeSpecified +
            " type or property not allowed",
          {
            file: parentJsDocNode.getSourceFile().getFilePath(),
            position: parentJsDocNode.getPos()
          }
        )
      );
    }

    const typeOf = (value: any): string => {
      const typeOfValue = Object.prototype.toString.call(value);
      const regex = /\[object |\]/g;
      return typeOfValue.replace(regex, "").toLowerCase();
    };

    if (
      schemaProps.some(
        schemaProp =>
          (propTypeMap.get(schemaProp.name)?.type === "any" &&
            typeOf(schemaProp.value) !== subTypeSpecified) ||
          (propTypeMap.get(schemaProp.name)?.type !== "any" &&
            propTypeMap.get(schemaProp.name)?.type !== typeOf(schemaProp.value))
      )
    ) {
      return err(
        new ParserError("property type is wrong", {
          file: parentJsDocNode.getSourceFile().getFilePath(),
          position: parentJsDocNode.getPos()
        })
      );
    }

    return ok(schemaProps);
  }
  return;
}

export const propTypeMap = new Map<
  string,
  {
    type: "string" | "number" | "boolean" | "any";
    targetTypes: (TypeKind | "number")[];
  }
>([
  ["additionalProperties", { type: "boolean", targetTypes: [TypeKind.OBJECT] }],
  [
    "default",
    {
      type: "any",
      targetTypes: [
        "number",
        TypeKind.STRING,
        TypeKind.BOOLEAN,
        TypeKind.ARRAY,
        TypeKind.OBJECT
      ]
    }
  ],
  [
    "deprecated",
    {
      type: "boolean",
      targetTypes: [
        "number",
        TypeKind.STRING,
        TypeKind.BOOLEAN,
        TypeKind.ARRAY,
        TypeKind.OBJECT,
        TypeKind.UNION,
        TypeKind.INTERSECTION
      ]
    }
  ],
  [
    "example",
    {
      type: "any",
      targetTypes: [
        "number",
        TypeKind.STRING,
        TypeKind.BOOLEAN,
        TypeKind.ARRAY,
        TypeKind.OBJECT,
        TypeKind.UNION,
        TypeKind.INTERSECTION
      ]
    }
  ],
  ["exclusiveMaximum", { type: "boolean", targetTypes: ["number"] }],
  ["exclusiveMinimum", { type: "boolean", targetTypes: ["number"] }],
  ["maximum", { type: "number", targetTypes: ["number"] }],
  ["maxItems", { type: "number", targetTypes: [TypeKind.ARRAY] }],
  ["maxLength", { type: "number", targetTypes: [TypeKind.STRING] }],
  ["maxProperties", { type: "number", targetTypes: [TypeKind.OBJECT] }],
  ["minimum", { type: "number", targetTypes: ["number"] }],
  ["minItems", { type: "number", targetTypes: [TypeKind.ARRAY] }],
  ["minLength", { type: "number", targetTypes: [TypeKind.STRING] }],
  ["minProperties", { type: "number", targetTypes: [TypeKind.OBJECT] }],
  ["multipleOf", { type: "number", targetTypes: ["number"] }],
  ["pattern", { type: "string", targetTypes: [TypeKind.STRING] }],
  [
    "title",
    {
      type: "string",
      targetTypes: [
        "number",
        TypeKind.STRING,
        TypeKind.BOOLEAN,
        TypeKind.ARRAY,
        TypeKind.OBJECT,
        TypeKind.UNION,
        TypeKind.INTERSECTION
      ]
    }
  ],
  ["uniqueItems", { type: "boolean", targetTypes: [TypeKind.ARRAY] }]
]);

const spotTypesToJSTypesMap = new Map<TypeKind, TypeKind | "number">([
  [TypeKind.INT32, "number"],
  [TypeKind.INT64, "number"],
  [TypeKind.INT_LITERAL, "number"],
  [TypeKind.FLOAT, "number"],
  [TypeKind.FLOAT_LITERAL, "number"],
  [TypeKind.DOUBLE, "number"],
  [TypeKind.BOOLEAN_LITERAL, TypeKind.BOOLEAN],
  [TypeKind.STRING_LITERAL, TypeKind.STRING],
  [TypeKind.DATE, TypeKind.STRING],
  [TypeKind.DATE_TIME, TypeKind.STRING]
]);
