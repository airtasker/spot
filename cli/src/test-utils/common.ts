export interface TestConfig {
  baseStateUrl: string;
  baseUrl: string;
  testFilter?: TestFilter;
  debugMode?: boolean;
}

export interface TestFilter {
  endpoint: string;
  test?: string;
}
