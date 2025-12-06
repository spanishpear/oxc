import { RuleTester } from "#oxlint";
import { describe, it } from "./capture.ts";
import { FILTER_CODE } from "./filter.ts";

import type { Rule } from "#oxlint";

type Config = RuleTester.Config;
type DescribeFn = RuleTester.DescribeFn;
type ItFn = RuleTester.ItFn;
type TestCases = RuleTester.TestCases;
type ValidTestCase = RuleTester.ValidTestCase;
type InvalidTestCase = RuleTester.InvalidTestCase;
type TestCase = ValidTestCase | InvalidTestCase;
type LanguageOptions = RuleTester.LanguageOptions;

// Set up `RuleTester` to use our hooks
RuleTester.describe = describe;
RuleTester.it = it;

// Enable ESLint compatibility mode
const DEFAULT_SHARED_CONFIG: Config = { eslintCompat: true };
RuleTester.setDefaultConfig({ ...DEFAULT_SHARED_CONFIG });

/**
 * Shim of `RuleTester` class.
 * Prevents disabling ESLint compatibility mode or overriding `describe` and `it` properties.
 */
class RuleTesterShim extends RuleTester {
  // Prevent setting `eslintCompat` property

  constructor(config?: Config) {
    if (config != null) config = modifyConfigOrTestCase(config);
    super(config);
  }

  static setDefaultConfig(config: Config): void {
    if (typeof config !== "object" || config === null) {
      throw new TypeError("`config` must be an object");
    }

    config = modifyConfigOrTestCase(config);
    config = { ...config, eslintCompat: true };

    super.setDefaultConfig(config);
  }

  static resetDefaultConfig() {
    // Clone, so that user can't get `DEFAULT_SHARED_CONFIG` with `getDefaultConfig()` and modify it
    super.setDefaultConfig({ ...DEFAULT_SHARED_CONFIG });
  }

  run(ruleName: string, rule: Rule, tests: TestCases): void {
    let { valid, invalid } = tests;

    // Apply filter
    if (FILTER_CODE !== null) {
      valid = valid.filter((test) => {
        const code = typeof test === "string" ? test : test.code;
        return code === FILTER_CODE;
      });
      invalid = invalid.filter((test) => test.code === FILTER_CODE);
    }

    // Prevent setting `eslintCompat` property
    valid = valid.map((test) => {
      if (typeof test === "string") return test;
      return modifyConfigOrTestCase(test);
    });
    invalid = invalid.map(modifyConfigOrTestCase);

    tests = { ...tests, valid, invalid };

    super.run(ruleName, rule, tests);
  }

  // Prevent changing `describe` or `it` properties

  static get describe(): DescribeFn {
    return describe;
  }

  static set describe(_value: DescribeFn) {
    throw new Error("Cannot override `describe` property");
  }

  static get it(): ItFn {
    return it;
  }

  static set it(_value: ItFn) {
    throw new Error("Cannot override `it` property");
  }

  static get itOnly(): ItFn {
    return it.only;
  }

  static set itOnly(_value: ItFn) {
    throw new Error("Cannot override `itOnly` property");
  }
}

/**
 * Modify config or test case.
 *
 * Throw error if has `eslintCompat` property.
 *
 * @param test - Test case
 * @returns Modified test case
 */
function modifyConfigOrTestCase<T extends Config | TestCase>(value: T): T {
  if ("eslintCompat" in value) throw new Error("Cannot set `eslintCompat` property");
  return value;
}

export { RuleTesterShim as RuleTester };
