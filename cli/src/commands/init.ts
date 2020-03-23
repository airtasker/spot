import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
import fs from "fs-extra";
import { outputFile } from "../../../lib/src/io/output";

export default class Init extends Command {
  static description = "Generates the boilerplate for an API.";

  static examples = [
    `$ spot init
Generated the following files:
- api.ts
- tsconfig.json
- package.json
`
  ];

  static flags = {
    help: flags.help({ char: "h" })
  };

  async run(): Promise<void> {
    if (fs.existsSync("api.ts")) {
      this.error(`There is already an API here!`);
      this.exit(1);
    }
    outputFile(
      ".",
      "api.ts",
      `import { api, body, endpoint, request, response, String } from "@airtasker/spot";

@api({ name: "my-api" })
class Api {}

@endpoint({
  method: "POST",
  path: "/users"
})
class CreateUser {
  @request
  request(
    @body body: CreateUserRequest
  ) {}

  @response({ status: 201 })
  successfulResponse(
    @body body: CreateUserResponse
  ) {}
}

interface CreateUserRequest {
  firstName: String;
  lastName: String;
}

interface CreateUserResponse {
  firstName: String;
  lastName: String;
  role: String;
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
    execSync(`yarn add @airtasker/spot`, {
      stdio: "inherit"
    });
  }
}
