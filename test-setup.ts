import { TypeStore } from "./libnext/src/parsers/utilities/types-store";

/**
 * Less than ideal. Until the TypeStore singleton is removed, we reset the singleton after each test.
 */
afterEach(() => {
  Object.keys(TypeStore).forEach(key => {
    delete TypeStore[key];
  });
});
