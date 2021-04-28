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
    rawSchemaProps.every(schemaProp => {
      const schemaPropName = schemaProp?.split("\n")[0]?.trim();
      const schemaPropValue = schemaProp?.split("\n")[1]?.trim();

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
          (schemaPropName === "pattern" ||
            (type.kind === TypeKind.STRING && schemaPropName === "example")) &&
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

    const typeOf = (value: any): string => {
      if (/^-?\d+$/.test(value)) {
        return "number";
      }

      if (typeof value === "boolean") {
        return "boolean";
      }

      return "string";
    };

    const nameSchemaProps: string[] = schemaProps.map(ex => {
      return ex.name;
    });

    const spotTypesToJSTypesMap = new Map();
    spotTypesToJSTypesMap.set(TypeKind.INT32, "number");
    spotTypesToJSTypesMap.set(TypeKind.INT64, "number");
    spotTypesToJSTypesMap.set(TypeKind.FLOAT, "number");
    spotTypesToJSTypesMap.set(TypeKind.DOUBLE, "number");

    const typeSpecified: string =
      spotTypesToJSTypesMap.get(type.kind) || type.kind;

    if (
      schemaProps.some(
        schemaProp =>
          schemaProp.name === "example" &&
          typeOf(schemaProp.value) !== typeSpecified
      )
    ) {
      return err(
        new ParserError("type of example must match type of param", {
          file: parentJsDocNode.getSourceFile().getFilePath(),
          position: parentJsDocNode.getPos()
        })
      );
    }

    if (
      (typeSpecified === "string" &&
        nameSchemaProps.some(
          nameSchemaProp =>
            nameSchemaProp !== "minLength" &&
            nameSchemaProp !== "maxLength" &&
            nameSchemaProp !== "pattern" &&
            nameSchemaProp !== "example"
        )) ||
      (typeSpecified === "number" &&
        nameSchemaProps.some(
          nameSchemaProp =>
            nameSchemaProp !== "minimum" &&
            nameSchemaProp !== "maximum" &&
            nameSchemaProp !== "default" &&
            nameSchemaProp !== "example"
        )) ||
      (typeSpecified === "boolean" &&
        nameSchemaProps.some(nameSchemaProp => nameSchemaProp !== "example"))
    ) {
      return err(
        new ParserError(
          "property must be compliant with " + typeSpecified + " type",
          {
            file: parentJsDocNode.getSourceFile().getFilePath(),
            position: parentJsDocNode.getPos()
          }
        )
      );
    }

    return ok(schemaProps);
  }
  return;
}
