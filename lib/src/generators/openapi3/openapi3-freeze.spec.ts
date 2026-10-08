import { createHash } from "crypto";
import fs from "fs";
import YAML from "js-yaml";
import path from "path";
import { parse } from "../../parser";
import { generateOpenAPI3 } from "./openapi3";

/**
 * The openapi3 generator's output is a compatibility surface: downstream
 * client generators read its exact shapes. These are the sha256 hashes of
 * that output, in both formats `spot generate` writes, for every contract in
 * `__spec-examples__/` and for `test-fixtures/contract/api.ts`.
 *
 * They are hard-coded rather than held in a Jest snapshot so that `jest -u`
 * cannot rewrite them. The YAML hash also covers the serialiser, so a
 * js-yaml upgrade that changes the written file fails here even when every
 * snapshot of the generated object stays green.
 *
 * A hash changes only when the generated output changes. If that is
 * intended, replace the hash in the same change and say why in its
 * description.
 */
const EXPECTED_HASHES: Record<string, { json: string; yaml: string }> = {
  "contract-with-array-query-param-and-comma-serialization-strategy.ts": {
    json: "842e83c5c56c98b81dd408efac36deb15fcadd993fd2db9077af61fa408fc19f",
    yaml: "11e18601a54228cbfb69a2cb12620046e49a944c14544e715413960882e575b6"
  },
  "contract-with-array-query-param.ts": {
    json: "f48be1d528dd3ea035490451cfb221b381bd9c9457e0c11fae2299b88f9d22d9",
    yaml: "5a3a001ff538fe8ea363635ff69a9ea6676c53821da02f3817f52788b1736510"
  },
  "contract-with-delete-endpoint.ts": {
    json: "ab9ad4df5e0cdde9a198add541ee8fb1fd7d7ad0efd78a45c4b8b6b79e4ce032",
    yaml: "7ff86de53c3f41734cafea0d928a5b4531ba26d5caf7314c5c2f704b9ffa9681"
  },
  "contract-with-endpoint-metadata.ts": {
    json: "01ce651fa8f5b435e31944dd755d72a0bdeae58fb915c9be84d24790b9e75aaf",
    yaml: "f45c813ba818d6c2c3046006e93ddd08f11f60eec319412a54003398df95ced3"
  },
  "contract-with-examples.ts": {
    json: "1b77d3fe6c21e797aeb232358af3f8b461be5f5ca26cf83b3747b41231be05a1",
    yaml: "9d8a6e59bb85ce4f168d5b6a6853863f92b109d823678185dba170a6c53c60f1"
  },
  "contract-with-get-endpoint.ts": {
    json: "019d3543fbb84f4598df42116041415ea729a549005074a591ef7f4e659d674d",
    yaml: "11b4e892e55acb3bb5bff17e389aa7449f0dee2151e2f6a27b1eb74f7ba162cd"
  },
  "contract-with-head-endpoint.ts": {
    json: "2569a7de95114f37874f7573177abb4608115a0bb7b4f6f48c5f20c507bf9cbb",
    yaml: "e063a545b16ab11cc774b46ffebdbc32d24a75b295ba82875d53673cd3dddfdf"
  },
  "contract-with-intersection-types.ts": {
    json: "ad16b26c04585ddd3ad37a6be0691a8112649bd0844865ac842186d48419ad07",
    yaml: "3360296df1c1a752948885522f0b478dee3ea380c8b15eaddd399391cfc96f36"
  },
  "contract-with-multiple-servers.ts": {
    json: "312496597718c2625f6d515b5559ff144936ec146cfe9a1ff227e75b8ecad2b2",
    yaml: "4a72f061ff0893c01ecb8449f95322935ddb6874f83e31f961475c23d706730b"
  },
  "contract-with-object-query-param.ts": {
    json: "f4ffaa108ea1983685851c8b6cd1fc36d9cc831e9f7b8410f5c78616dedd0b9b",
    yaml: "3f1be669dd923d102736513287a629b9cb3592f4cc137ce1db78f2c31cf25d0c"
  },
  "contract-with-one-server.ts": {
    json: "0d5f65643eab940afbed4b76d44cd72fef3105511890fedef416c255c28e7bc2",
    yaml: "efb283d6d34106fa529bddfbdfa8955de2c68ebbd6061aed089d6a87dff646e3"
  },
  "contract-with-patch-endpoint.ts": {
    json: "d26f97ce6c8851b8fa82529aa1a5fa15b8efb34e0dacd36a5389b0a75f1e26c4",
    yaml: "86ee83150beda97f27af4c0c213d83896534c0078f860e88982071cb56d1d6e6"
  },
  "contract-with-path-params.ts": {
    json: "504495e4142cfa393f25db71edc6538fbefade9bbb8851e2a7e04009dd922279",
    yaml: "b0285ae91e1965bb254115d00dd772b368e4b1644c6f50461bd0927e1c41441c"
  },
  "contract-with-post-endpoint.ts": {
    json: "3fb4638a04afe3a8f6bb3cceff8651c801610f7fa40771f923fe90b94e4bad93",
    yaml: "336024f3f943c99011e314b047e7e31ea7effce19ff651d97e62dfd8c3d3cc0d"
  },
  "contract-with-put-endpoint.ts": {
    json: "eb1b6a15796706200874727e48e56a9c38585da56baa956b69db716e2af112a1",
    yaml: "68d4e8f17d76f31e2538436c29f0555693e84173ea34e793f625ed711a41d7cd"
  },
  "contract-with-query-params.ts": {
    json: "33de736dbc9e1e4a0cc227cc0c13c8ca0567547553d35f19c4492192f0a21b0a",
    yaml: "54cf7d401bda80b724898687cc7fae177e7f8b074f4da5bc2c28ed16ea63aea3"
  },
  "contract-with-request-headers.ts": {
    json: "4cb4608e5197ac0e2e9ff141284844dfcac5542f0ced75a89b0f0f3541bd3f6c",
    yaml: "4d419699ea2d203b8e88bf9e7e7cac2c49f8cb0528be750955aca8c0742a70c2"
  },
  "contract-with-response-headers.ts": {
    json: "cdbe82482d59376994572df1b3cba6ad935d38f0a8f447669326d590ec796afa",
    yaml: "476ba077169502935e15c5dfa95e4f4510d9f1f6c9b44f0d9e54bae7ce8cbe26"
  },
  "contract-with-schemaprops.ts": {
    json: "e47b269843acc84a1ecaf5762dc0762527f44b27960b94d1ad5041f3d7887cde",
    yaml: "382493898cc8106410b238c9c45e4eee626c9af23410624c007e69b2616ad695"
  },
  "contract-with-security-header.ts": {
    json: "c0356b19566c1a82d0550234cca219a5d2175070af0e235c6dde603b2052ea80",
    yaml: "80f1d0c356a3f4ec17f4bc7ea6409682825bada14628e8da489f751cae37e2cd"
  },
  "contract-with-specific-and-default-responses.ts": {
    json: "ccdd45e29340b30b87469f5556c23f5e3fe464a1543e92cec19330315106da79",
    yaml: "d2f337cf924ecdb0bd42fd0adf01b2775a7ed3282108865f2559435a36e7b083"
  },
  "minimal-contract.ts": {
    json: "fe6a5053dcba8d58a684dbee45624c80c01b6f69c15b79fd8bd21d4fe3dca433",
    yaml: "f56c1190dabd4ec4571377ad7ce5214d425652faec3663e7a35ca8f75adbc2c0"
  },
  "versioned-contract.ts": {
    json: "9d49cb5354d6995352ad1fd7d45e8d31e149626a5292d551386f2668fe8edf76",
    yaml: "b60687efc04a407550829e3051a81fae8ef7e164b5abc7bdc939b1954bb5d3e7"
  },
  "test-fixtures/contract/api.ts": {
    json: "891cf2460e6f512f6e81f2058c2ab1082ca8852799a3fcceb447ec5ea0140aee",
    yaml: "1f18d73320e08fb85efb0153219c1d50a6b791a13607f69e0cf2dec0c7cf7776"
  }
};

const SPEC_EXAMPLES_DIR = path.join(__dirname, "__spec-examples__");
const TEST_FIXTURE_CONTRACT = "test-fixtures/contract/api.ts";
const REPO_ROOT = path.join(__dirname, "../../../..");

function contractPath(name: string): string {
  return name === TEST_FIXTURE_CONTRACT
    ? path.join(REPO_ROOT, TEST_FIXTURE_CONTRACT)
    : path.join(SPEC_EXAMPLES_DIR, name);
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

describe("OpenAPI 3 generator output freeze", () => {
  test("every spec example has an expected hash", () => {
    const hashed = Object.keys(EXPECTED_HASHES).filter(
      name => name !== TEST_FIXTURE_CONTRACT
    );
    expect(fs.readdirSync(SPEC_EXAMPLES_DIR).sort()).toEqual(hashed.sort());
  });

  describe.each(Object.keys(EXPECTED_HASHES))("%s", name => {
    // The same parse and serialisation calls `spot generate` makes.
    let result: ReturnType<typeof generateOpenAPI3>;

    beforeAll(() => {
      result = generateOpenAPI3(parse(contractPath(name)));
    });

    test("JSON output is unchanged", () => {
      expect(sha256(JSON.stringify(result, null, 2))).toEqual(
        EXPECTED_HASHES[name].json
      );
    });

    test("YAML output is unchanged", () => {
      expect(sha256(YAML.dump(result, { skipInvalid: true }))).toEqual(
        EXPECTED_HASHES[name].yaml
      );
    });
  });
});
