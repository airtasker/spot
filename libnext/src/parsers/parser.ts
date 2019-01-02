import { Project } from "ts-simple-ast";
import { parseApi } from "./api-parser";
import { parseEndpoint } from "./endpoint-parser";

function parse(content: string) {
  const project = new Project();
  const sourceFile = project.createSourceFile("spot_contract.ts", content);
  const classes = sourceFile.getClasses();
  classes.filter(klass => klass.getDecorators().length > 0).forEach(klass => {
    if (klass.getDecorators().length === 1) {
      const decorator = klass.getDecorators()[0];
      switch (decorator.getName()) {
        case "api":
          parseApi(klass);
          break;
        case "endpoint":
          parseEndpoint(klass);
          break;
        default:
          throw new Error(`unidentified decorator - ${decorator.getName()}`);
      }
    } else {
      throw new Error("multiple decorators found");
    }
  });
}
