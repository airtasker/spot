import { JSDoc } from "ts-morph";
import { Type, TypeKind } from "../types";
import { err, ok, Result } from "../util";
import { Example } from "../definitions";
import { ParserError } from "../errors";

export function extractJSDocExamples(
  jsDoc: JSDoc | undefined,
  type: Type
): Result<Example[], ParserError> | undefined {
  // return early if there is no jsDoc available
  if (!jsDoc) {
    return;
  }
  const rawExamples = jsDoc
    .getTags()
    .filter(tag => tag.getTagName() === "example")
    .map(example => example.getComment());

  const parentJsDocNode = jsDoc.getParent();
  if (rawExamples && rawExamples.indexOf(undefined) !== -1) {
    return err(
      new ParserError("example must not be empty", {
        file: parentJsDocNode.getSourceFile().getFilePath(),
        position: parentJsDocNode.getPos()
      })
    );
  }

  if (rawExamples && rawExamples.length > 0) {
    const examples: Example[] = [];
    let exampleError;
    rawExamples.every(example => {
      const exampleStr = example?.toString();
      const exampleName = exampleStr?.split("\n")[0]?.trim();
      const exampleValue = exampleStr?.split("\n")[1]?.trim();

      if (!exampleName || !exampleValue) {
        exampleError = err(
          new ParserError("malformed example", {
            file: parentJsDocNode.getSourceFile().getFilePath(),
            position: parentJsDocNode.getPos()
          })
        );
        return false;
      } else {
        if (examples.some(ex => ex.name === exampleName)) {
          exampleError = err(
            new ParserError("duplicate example name", {
              file: parentJsDocNode.getSourceFile().getFilePath(),
              position: parentJsDocNode.getPos()
            })
          );
          return false;
        }

        if (
          type.kind === TypeKind.STRING &&
          (!exampleValue.startsWith('"') || !exampleValue.endsWith('"'))
        ) {
          exampleError = err(
            new ParserError("string examples must be quoted", {
              file: parentJsDocNode.getSourceFile().getFilePath(),
              position: parentJsDocNode.getPos()
            })
          );
          return false;
        }

        try {
          const parsedValue = JSON.parse(exampleValue);
          examples.push({ name: exampleName, value: parsedValue });
        } catch (e) {
          exampleError = err(
            new ParserError("could not parse example", {
              file: parentJsDocNode.getSourceFile().getFilePath(),
              position: parentJsDocNode.getPos()
            })
          );
          return false;
        }

        return true;
      }
    });
    if (exampleError) {
      return exampleError;
    }

    const typeOf = (value: string): string => {
      if (/^-?\d+$/.test(value)) {
        return "number";
      }

      if (typeof value === "boolean") {
        return "boolean";
      }

      return "string";
    };

    const typeOfExamples: string[] = examples.map(ex => {
      return typeOf(ex.value);
    });

    const spotTypesToJSTypesMap = new Map();
    spotTypesToJSTypesMap.set(TypeKind.INT32, "number");
    spotTypesToJSTypesMap.set(TypeKind.INT64, "number");
    spotTypesToJSTypesMap.set(TypeKind.FLOAT, "number");
    spotTypesToJSTypesMap.set(TypeKind.DOUBLE, "number");

    const typeSpecified: string =
      spotTypesToJSTypesMap.get(type.kind) || type.kind;

    if (typeOfExamples.some(typeOfExample => typeOfExample !== typeSpecified)) {
      return err(
        new ParserError("type of example must match type of param", {
          file: parentJsDocNode.getSourceFile().getFilePath(),
          position: parentJsDocNode.getPos()
        })
      );
    }

    return ok(examples);
  }
  return;
}
