import { Node } from "ts-morph";

/**
 * Loci table is a lookup table for syntax location data.
 */
export class LociTable {
  static apiClassKey() {
    return "api_class";
  }

  static apiDecoratorKey() {
    return "api_decorator";
  }

  static apiNameKey() {
    return "api_name";
  }

  static apiDescriptionKey() {
    return "api_description";
  }

  static endpointClassKey(endpointName: string) {
    return `endpoint_<${endpointName}>_class`;
  }

  static endpointDecoratorKey(endpointName: string) {
    return `endpoint_<${endpointName}>_decorator`;
  }

  static endpointMethodKey(endpointName: string) {
    return `endpoint_<${endpointName}>_method`;
  }

  static endpointPathKey(endpointName: string) {
    return `endpoint_<${endpointName}>_path`;
  }

  static endpointTagsKey(endpointName: string) {
    return `endpoint_<${endpointName}>_tags`;
  }

  static endpointTagKey(endpointName: string, tag: string) {
    return `endpoint_<${endpointName}>_tag_<${tag}>`;
  }

  static endpointDescriptionKey(endpointName: string) {
    return `endpoint_<${endpointName}>_description`;
  }

  private locations: { [index: string]: Locus };

  constructor(locations: { [index: string]: Locus } = {}) {
    this.locations = locations;
  }

  /**
   * Add a locus to the loci table. If the lookup key is already present, `add` will throw an error.
   *
   * @param key lookup key
   * @param locus target locus
   */
  add(key: string, locus: Locus): void {
    if (this.locations[key] !== undefined) {
      throw Error(`Key already present in location table: ${key}`);
    }
    this.locations[key] = locus;
  }

  /**
   * Add a locus to the loci table by inferring from a ts-morph node. If the lookup key is already present, `addMorphNode` will throw an error.
   *
   * @param key lookup key
   * @param locus target locus
   */
  addMorphNode(key: string, node: Node): void {
    if (this.locations[key] !== undefined) {
      throw Error(`Key already present in location table: ${key}`);
    }
    this.locations[key] = {
      file: node.getSourceFile().getFilePath(),
      line: node.getStartLineNumber(),
      column: node.getStartLinePos()
    };
  }

  /**
   * Retrieve a locus by lookup key or error.
   *
   * @param key lookup key
   */
  getOrError(key: string): Locus {
    const location = this.locations[key];
    if (location === undefined) {
      throw Error(`Key not present in location table: ${key}`);
    }
    return location;
  }
}

/**
 * Locus represents a particular position in a file.
 */
export interface Locus {
  file: string;
  line: number;
  column: number;
}
