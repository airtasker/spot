import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import * as fs from "fs-extra";
import { outputFile } from "../../../lib/src/io/output";

export default class Init extends Command {
  static description = "Generates the boilerplate for an API.";

  static examples = [
    `$ api init
Generated the following files:
- api.ts
- tsconfig.json
- package.json
`
  ];

  static flags = {
    help: flags.help({ char: "h" })
  };

  async run() {
    if (fs.existsSync("api.ts")) {
      this.error(`There is already an API here!`);
      this.exit(1);
    }
    outputFile(
      ".",
      "api.ts",
      `import { api, endpoint, request, response } from "@zenclabs/spot";

@api()
class Api {
  @endpoint({
    method: "POST",
    path: "/users"
  })
  createUser(@request req: CreateUserRequest): CreateUserResponse {
    return response();
  }
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
}

interface CreateUserResponse {
  success: boolean;
}
`,
      false
    );
    outputFile(
      ".",
      "tsconfig.json",
      JSON.stringify(
        {
          compilerOptions: {
            target: "esnext",
            module: "esnext",
            moduleResolution: "node",
            experimentalDecorators: true
          }
        },
        null,
        2
      ),
      false
    );
    outputFile(".", "package.json", JSON.stringify({}, null, 2), false);
    execSync(`yarn add @zenclabs/spot`, {
      stdio: "inherit"
    });
  }
}
