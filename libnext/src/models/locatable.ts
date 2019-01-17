/** A locatable value */
export interface Locatable<T> {
  value: T;
  /** file path where the value is declared */
  location: string;
  /** line number that the value begins on */
  line: number;
}
