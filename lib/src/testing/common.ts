export interface TestConfig {
  testFilter?: TestFilter;
  includeDraft: boolean;
}

export interface TestFilter {
  endpoint: string;
  test?: string;
}
