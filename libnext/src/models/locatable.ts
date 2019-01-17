/** A locatable value */
export interface Locatable<T> {
  value: T;
  /** file path where the va;ie is located */
  location: string;
  /** line number that the value begins on */
  line: number;
}
