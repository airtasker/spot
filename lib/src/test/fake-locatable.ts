import { Locatable } from "../models/locatable";

export function fakeLocatable<T>(value: T): Locatable<T> {
  return {
    value,
    location: "somelocation.ts",
    line: 4
  };
}
