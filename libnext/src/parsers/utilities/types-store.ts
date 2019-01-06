import { DataType } from "../../models/types";

interface TypeStoreItem {
  description?: string;
  type: DataType;
}

export class TypesStore {
  [index: string]: TypeStoreItem;
}

/** Singleton type store to store reference types */
export const TypeStore = new TypesStore();
