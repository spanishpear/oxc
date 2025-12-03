export interface TestResult {
  groupName: string;
  code: string;
  isPassed: boolean;
  error: Error | null;
}

export interface RuleResult {
  ruleName: string;
  filePath: string;
  isLoadError: boolean;
  loadError: Error | null;
  tests: TestResult[];
}

const describeStack: string[] = [];

let currentRule: RuleResult | null = null;

/**
 * Set the current rule being tested.
 * Call before loading a file containing tests.
 * @param rule - `RuleResult` object
 */
export function setCurrentRule(rule: RuleResult): void {
  currentRule = rule;
}

/**
 * Reset the current rule being tested.
 * Call after loading a file containing tests.
 */
export function resetCurrentRule(): void {
  currentRule = null;
}

/**
 * Custom `describe` function that tracks the test hierarchy.
 */
export function describe(name: string, fn: () => void): void {
  describeStack.push(name);
  try {
    fn();
  } finally {
    describeStack.pop();
  }
}

/**
 * Custom `it` function that runs and records individual tests.
 */
export function it(code: string, fn: () => void): void {
  const testResult: TestResult = {
    groupName: describeStack.join(" > "),
    code,
    isPassed: false,
    error: null,
  };

  try {
    fn();
    testResult.isPassed = true;
  } catch (err) {
    testResult.error = err as Error;
  }

  currentRule!.tests.push(testResult);
}

// Add `it.only` property for compatibility.
// `it.only` behaves the same as `it`.
it.only = (name: string, fn: () => void): void => it(name, fn);
