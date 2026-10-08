import Ajv2020, { ErrorObject, ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { OAS_3_1_DIALECT } from "./oas-3-1-dialect";
import { OAS_3_1_META } from "./oas-3-1-meta";
import { OAS_3_1_SCHEMA } from "./oas-3-1-schema";

/**
 * A single way in which a document fails to conform to OpenAPI 3.1.
 *
 * `path` is a JSON Pointer to the offending location in the document.
 */
export interface Violation {
  path: string;
  message: string;
}

export interface ValidationResult {
  errors: Violation[];
  warnings: Violation[];
}

export class OpenApi31ComplianceError extends Error {
  readonly violations: Violation[];

  constructor(violations: Violation[]) {
    super(
      [
        `The generated document does not conform to OpenAPI 3.1 (${violations.length} violation${violations.length === 1 ? "" : "s"}):`,
        ...violations.map(formatViolation)
      ].join("\n")
    );
    this.name = "OpenApi31ComplianceError";
    this.violations = violations;
  }
}

export function formatViolation(violation: Violation): string {
  return `  ${violation.path || "/"}: ${violation.message}`;
}

const SCHEMA_REF_PREFIX = "#/components/schemas/";

/**
 * Checks a document against the OpenAPI 3.1 document schema, then against
 * the rules that schema cannot express.
 */
export function validateOpenAPI31(doc: unknown): ValidationResult {
  const errors = structuralViolations(doc);
  const warnings: Violation[] = [];
  new SemanticChecker(doc, errors, warnings).run();
  return { errors, warnings };
}

let cachedValidator: ValidateFunction | undefined;

/**
 * ajv implements `$dynamicRef` only partially: left in place, the
 * `{ "$dynamicRef": "#meta" }` entries in the document schema make ajv
 * reject every Schema Object with "must NOT have unevaluated properties".
 * Each one means "validate this Schema Object against the OAS dialect", so
 * each is replaced by a static `$ref` to that dialect.
 */
export function withStaticDialectRefs(schema: Record<string, unknown>): {
  schema: Record<string, unknown>;
  replacements: number;
} {
  let replacements = 0;
  const rewritten = JSON.parse(JSON.stringify(schema), (_key, value) => {
    if (isRecord(value) && value.$dynamicRef === "#meta") {
      replacements++;
      return { $ref: OAS_3_1_DIALECT.$id };
    }
    return value;
  });
  return { schema: rewritten, replacements };
}

function documentValidator(): ValidateFunction {
  if (cachedValidator === undefined) {
    // strict mode rejects the upstream schemas (strictTypes).
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(ajv);
    // The document schema applies this format to media type keys. ajv has no
    // implementation of it, so it is kept an annotation, as in the OAS dialect.
    ajv.addFormat("media-range", true);
    ajv.addMetaSchema(OAS_3_1_META);
    ajv.addMetaSchema(OAS_3_1_DIALECT);
    cachedValidator = ajv.compile(withStaticDialectRefs(OAS_3_1_SCHEMA).schema);
  }
  return cachedValidator;
}

function structuralViolations(doc: unknown): Violation[] {
  const validate = documentValidator();
  if (validate(doc)) {
    return [];
  }
  const seen = new Set<string>();
  const violations: Violation[] = [];
  for (const error of validate.errors ?? []) {
    const violation = {
      path: error.instancePath,
      message: ajvErrorMessage(error)
    };
    const key = `${violation.path}\u0000${violation.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      violations.push(violation);
    }
  }
  return violations;
}

function ajvErrorMessage(error: ErrorObject): string {
  const message = error.message ?? `fails ${error.keyword}`;
  const { params } = error;
  switch (error.keyword) {
    case "unevaluatedProperties":
      return `${message}: ${JSON.stringify(params.unevaluatedProperty)}`;
    case "additionalProperties":
      return `${message}: ${JSON.stringify(params.additionalProperty)}`;
    case "enum":
      return `${message}: ${JSON.stringify(params.allowedValues)}`;
    default:
      return message;
  }
}

type JsonObject = Record<string, unknown>;

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace"
];

/**
 * Walks schema positions only: `components.schemas`, the `schema` of
 * parameters, headers and media types, and from there `properties` values,
 * `items`, `oneOf`, `anyOf` and `allOf`. Example values, `default` and
 * `enum` are data, and the keys of `properties` are names, so neither is
 * ever read as a keyword.
 */
class SemanticChecker {
  private readonly schemas: JsonObject;

  constructor(
    private readonly doc: unknown,
    private readonly errors: Violation[],
    private readonly warnings: Violation[]
  ) {
    const components = isRecord(doc) ? doc.components : undefined;
    this.schemas =
      isRecord(components) && isRecord(components.schemas)
        ? components.schemas
        : {};
  }

  run(): void {
    if (!isRecord(this.doc)) {
      return;
    }
    this.checkServers(this.doc.servers);
    for (const [name, schema] of Object.entries(this.schemas)) {
      this.checkSchema(schema, `/components/schemas/${pointerToken(name)}`);
    }
    if (isRecord(this.doc.paths)) {
      for (const [path, pathItem] of Object.entries(this.doc.paths)) {
        this.checkPathItem(pathItem, `/paths/${pointerToken(path)}`);
      }
    }
  }

  private error(path: string, message: string): void {
    this.errors.push({ path, message });
  }

  private warn(path: string, message: string): void {
    this.warnings.push({ path, message });
  }

  private checkServers(servers: unknown): void {
    if (!Array.isArray(servers)) {
      return;
    }
    servers.forEach((server, index) => {
      if (!isRecord(server) || !isRecord(server.variables)) {
        return;
      }
      for (const [name, variable] of Object.entries(server.variables)) {
        if (
          isRecord(variable) &&
          Array.isArray(variable.enum) &&
          !variable.enum.includes(variable.default)
        ) {
          this.error(
            `/servers/${index}/variables/${pointerToken(name)}/default`,
            `default ${JSON.stringify(variable.default)} is not one of the variable's enum values ${JSON.stringify(variable.enum)}`
          );
        }
      }
    });
  }

  private checkPathItem(pathItem: unknown, path: string): void {
    if (!isRecord(pathItem)) {
      return;
    }
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!isRecord(operation)) {
        continue;
      }
      const operationPath = `${path}/${method}`;
      if (Array.isArray(operation.parameters)) {
        operation.parameters.forEach((parameter, index) => {
          if (isRecord(parameter)) {
            this.checkSchema(
              parameter.schema,
              `${operationPath}/parameters/${index}/schema`
            );
          }
        });
      }
      if (isRecord(operation.requestBody)) {
        this.checkContent(
          operation.requestBody.content,
          `${operationPath}/requestBody/content`
        );
      }
      if (isRecord(operation.responses)) {
        for (const [status, response] of Object.entries(operation.responses)) {
          if (!isRecord(response)) {
            continue;
          }
          const responsePath = `${operationPath}/responses/${pointerToken(status)}`;
          this.checkContent(response.content, `${responsePath}/content`);
          if (isRecord(response.headers)) {
            for (const [name, header] of Object.entries(response.headers)) {
              if (isRecord(header)) {
                this.checkSchema(
                  header.schema,
                  `${responsePath}/headers/${pointerToken(name)}/schema`
                );
              }
            }
          }
        }
      }
    }
  }

  private checkContent(content: unknown, path: string): void {
    if (!isRecord(content)) {
      return;
    }
    for (const [mediaType, mediaTypeObject] of Object.entries(content)) {
      if (isRecord(mediaTypeObject)) {
        this.checkSchema(
          mediaTypeObject.schema,
          `${path}/${pointerToken(mediaType)}/schema`
        );
      }
    }
  }

  private checkSchema(schema: unknown, path: string): void {
    if (!isRecord(schema)) {
      return;
    }

    if ("nullable" in schema) {
      this.error(
        `${path}/nullable`,
        'the "nullable" keyword does not exist in OpenAPI 3.1; add "null" to "type" or an { "type": "null" } member instead'
      );
    }
    if ("example" in schema) {
      this.error(
        `${path}/example`,
        'the "example" keyword is deprecated in OpenAPI 3.1 Schema Objects; use "examples"'
      );
    }
    if ("$ref" in schema) {
      this.checkRef(schema.$ref, `${path}/$ref`);
    }
    if ("discriminator" in schema) {
      this.checkDiscriminator(schema, path);
    } else if (Array.isArray(schema.oneOf)) {
      this.checkOneOfOverlap(schema.oneOf, `${path}/oneOf`);
    }

    if (isRecord(schema.properties)) {
      for (const [name, property] of Object.entries(schema.properties)) {
        this.checkSchema(property, `${path}/properties/${pointerToken(name)}`);
      }
    }
    this.checkSchema(schema.items, `${path}/items`);
    for (const keyword of ["oneOf", "anyOf", "allOf"]) {
      const members = schema[keyword];
      if (Array.isArray(members)) {
        members.forEach((member, index) =>
          this.checkSchema(member, `${path}/${keyword}/${index}`)
        );
      }
    }
  }

  private checkRef(ref: unknown, path: string): void {
    if (typeof ref !== "string" || !ref.startsWith(SCHEMA_REF_PREFIX)) {
      this.error(
        path,
        `${JSON.stringify(ref)} does not start with "${SCHEMA_REF_PREFIX}"`
      );
      return;
    }
    if (this.resolveRef(ref) === undefined) {
      this.error(path, `${JSON.stringify(ref)} does not resolve to a schema`);
    }
  }

  private resolveRef(ref: string): unknown {
    if (!ref.startsWith(SCHEMA_REF_PREFIX)) {
      return undefined;
    }
    const name = ref
      .slice(SCHEMA_REF_PREFIX.length)
      .replace(/~1/g, "/")
      .replace(/~0/g, "~");
    return Object.prototype.hasOwnProperty.call(this.schemas, name)
      ? this.schemas[name]
      : undefined;
  }

  private checkDiscriminator(schema: JsonObject, path: string): void {
    const discriminatorPath = `${path}/discriminator`;
    const { discriminator, oneOf } = schema;
    if (!isRecord(discriminator)) {
      return;
    }
    if (!Array.isArray(oneOf)) {
      this.error(discriminatorPath, 'a discriminator must sit beside "oneOf"');
      return;
    }

    oneOf.forEach((member, index) => {
      if (this.admitsNull(member, new Set())) {
        this.error(
          `${path}/oneOf/${index}`,
          "a member of a discriminated oneOf admits null; the null branch belongs outside the discriminated oneOf"
        );
      }
    });

    const { propertyName, mapping } = discriminator;
    if (typeof propertyName !== "string") {
      return;
    }

    if (mapping === undefined) {
      oneOf.forEach((member, index) => {
        const target = this.objectShape(member, new Set());
        if (!target.required.has(propertyName)) {
          this.error(
            `${path}/oneOf/${index}`,
            `the discriminator property "${propertyName}" is not a required property of this member`
          );
        }
      });
      return;
    }
    if (!isRecord(mapping)) {
      return;
    }

    const memberRefs = new Set<string>();
    oneOf.forEach((member, index) => {
      if (isRecord(member) && typeof member.$ref === "string") {
        memberRefs.add(member.$ref);
      } else {
        this.error(
          `${path}/oneOf/${index}`,
          "every member of a oneOf with a discriminator mapping must be a $ref"
        );
      }
    });
    const mappedRefs = new Set(
      Object.values(mapping).filter(
        (value): value is string => typeof value === "string"
      )
    );
    const unmapped = [...memberRefs].filter(ref => !mappedRefs.has(ref));
    const notMembers = [...mappedRefs].filter(ref => !memberRefs.has(ref));
    if (unmapped.length > 0 || notMembers.length > 0) {
      this.error(
        `${discriminatorPath}/mapping`,
        [
          "the mapping values must equal the oneOf $refs",
          unmapped.length > 0 &&
            `oneOf members missing from the mapping: ${unmapped.join(", ")}`,
          notMembers.length > 0 &&
            `mapping values that are not oneOf members: ${notMembers.join(", ")}`
        ]
          .filter(Boolean)
          .join("; ")
      );
    }

    for (const [key, ref] of Object.entries(mapping)) {
      if (typeof ref !== "string") {
        continue;
      }
      const keyPath = `${discriminatorPath}/mapping/${pointerToken(key)}`;
      const target = this.objectShape({ $ref: ref }, new Set());
      if (!target.required.has(propertyName)) {
        this.error(
          keyPath,
          `the mapping target ${ref} does not have "${propertyName}" as a required property`
        );
        continue;
      }
      const enums = (target.properties.get(propertyName) ?? [])
        .map(property => this.dereference(property, new Set()))
        .filter(isRecord)
        .map(property => property.enum)
        .filter(Array.isArray);
      if (enums.length === 0 || enums.some(values => !values.includes(key))) {
        this.error(
          keyPath,
          `the "${propertyName}" property of the mapping target ${ref} does not restrict its value to ${JSON.stringify(key)} with "enum"`
        );
      }
    }
  }

  /**
   * Overlapping members make a value match more than one branch of a
   * `oneOf`, which fails validation. `null` is checked across every member;
   * other values only across scalar members, because whether two object
   * schemas overlap cannot be decided in general.
   */
  private checkOneOfOverlap(members: unknown[], path: string): void {
    const nullable = members
      .map((member, index) => ({ member, index }))
      .filter(({ member }) => this.admitsNull(member, new Set()))
      .map(({ index }) => `${path}/${index}`);
    if (nullable.length > 1) {
      this.warn(
        path,
        `members ${nullable.join(", ")} all admit null, so null matches more than one oneOf branch and is rejected`
      );
    }

    const scalars = members.map(member => this.scalarShape(member));
    for (let i = 0; i < scalars.length; i++) {
      for (let j = i + 1; j < scalars.length; j++) {
        const a = scalars[i];
        const b = scalars[j];
        if (a !== undefined && b !== undefined && scalarsOverlap(a, b)) {
          this.warn(
            path,
            `members ${i} and ${j} can match the same value, so that value matches more than one oneOf branch`
          );
        }
      }
    }
  }

  /** The non-null values a scalar member accepts. */
  private scalarShape(schema: unknown): ScalarShape | undefined {
    const resolved = this.dereference(schema, new Set());
    if (!isRecord(resolved) || resolved.type === undefined) {
      return undefined;
    }
    if (
      ["properties", "items", "oneOf", "anyOf", "allOf", "$ref"].some(
        keyword => keyword in resolved
      )
    ) {
      return undefined;
    }
    const types = (
      Array.isArray(resolved.type) ? resolved.type : [resolved.type]
    ).filter((type): type is string => typeof type === "string");
    if (types.some(type => type === "object" || type === "array")) {
      return undefined;
    }
    const nonNullTypes = types.filter(type => type !== "null");
    if (nonNullTypes.length === 0) {
      return undefined;
    }
    return {
      types: new Set(nonNullTypes),
      enum: Array.isArray(resolved.enum)
        ? resolved.enum.filter(value => value !== null)
        : undefined
    };
  }

  /** Follows a chain of `$ref`s to the first schema that is not a bare reference. */
  private dereference(schema: unknown, visited: Set<string>): unknown {
    if (!isRecord(schema) || typeof schema.$ref !== "string") {
      return schema;
    }
    if (visited.has(schema.$ref)) {
      return undefined;
    }
    visited.add(schema.$ref);
    return this.dereference(this.resolveRef(schema.$ref), visited);
  }

  /**
   * Whether a schema can accept `null`. Every keyword present must accept
   * it, as in JSON Schema; a `$ref` cycle is treated as not accepting it.
   */
  private admitsNull(schema: unknown, visited: Set<string>): boolean {
    if (schema === true) {
      return true;
    }
    if (!isRecord(schema)) {
      return false;
    }
    const { type, $ref, oneOf, anyOf, allOf } = schema;
    if (type !== undefined) {
      const types = Array.isArray(type) ? type : [type];
      if (!types.includes("null")) {
        return false;
      }
    }
    if (Array.isArray(schema.enum) && !schema.enum.includes(null)) {
      return false;
    }
    if (typeof $ref === "string") {
      if (visited.has($ref)) {
        return false;
      }
      if (!this.admitsNull(this.resolveRef($ref), new Set(visited).add($ref))) {
        return false;
      }
    }
    if (
      Array.isArray(allOf) &&
      !allOf.every(member => this.admitsNull(member, visited))
    ) {
      return false;
    }
    for (const members of [anyOf, oneOf]) {
      if (
        Array.isArray(members) &&
        !members.some(member => this.admitsNull(member, visited))
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * The properties and required names of an object schema, following `$ref`
   * chains and merging `allOf` members.
   */
  private objectShape(schema: unknown, visited: Set<string>): ObjectShape {
    const shape: ObjectShape = { required: new Set(), properties: new Map() };
    const merge = (other: ObjectShape) => {
      other.required.forEach(name => shape.required.add(name));
      other.properties.forEach((schemas, name) =>
        shape.properties.set(name, [
          ...(shape.properties.get(name) ?? []),
          ...schemas
        ])
      );
    };

    if (!isRecord(schema)) {
      return shape;
    }
    if (typeof schema.$ref === "string" && !visited.has(schema.$ref)) {
      merge(
        this.objectShape(
          this.resolveRef(schema.$ref),
          new Set(visited).add(schema.$ref)
        )
      );
    }
    if (Array.isArray(schema.allOf)) {
      schema.allOf.forEach(member => merge(this.objectShape(member, visited)));
    }
    if (Array.isArray(schema.required)) {
      schema.required
        .filter((name): name is string => typeof name === "string")
        .forEach(name => shape.required.add(name));
    }
    if (isRecord(schema.properties)) {
      for (const [name, property] of Object.entries(schema.properties)) {
        merge({
          required: new Set(),
          properties: new Map([[name, [property]]])
        });
      }
    }
    return shape;
  }
}

interface ObjectShape {
  required: Set<string>;
  properties: Map<string, unknown[]>;
}

interface ScalarShape {
  types: Set<string>;
  enum: unknown[] | undefined;
}

function scalarsOverlap(a: ScalarShape, b: ScalarShape): boolean {
  const accepts = (shape: ScalarShape, value: unknown): boolean =>
    jsonTypesOf(value).some(type => shape.types.has(type)) &&
    (shape.enum === undefined || shape.enum.includes(value));

  if (a.enum !== undefined) {
    return a.enum.some(value => accepts(b, value));
  }
  if (b.enum !== undefined) {
    return b.enum.some(value => accepts(a, value));
  }
  const widen = (types: Set<string>) =>
    types.has("integer") ? new Set([...types, "number"]) : types;
  const aTypes = widen(a.types);
  const bTypes = widen(b.types);
  return [...aTypes].some(
    type => bTypes.has(type) || (type === "number" && bTypes.has("integer"))
  );
}

function jsonTypesOf(value: unknown): string[] {
  if (value === null) {
    return ["null"];
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? ["integer", "number"] : ["number"];
  }
  return [typeof value];
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pointerToken(token: string): string {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}
