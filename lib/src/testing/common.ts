export interface TestConfig {
  testFilter?: TestFilter;
}

export interface TestFilter {
  endpoint: string;
  test?: string;
}
