import assert from "node:assert";
import { RuleTester } from "#oxlint";
import { describe, it } from "./capture.ts";

import type { Rule } from "#oxlint";

type Config = RuleTester.Config;
type DescribeFn = RuleTester.DescribeFn;
type ItFn = RuleTester.ItFn;
type TestCases = RuleTester.TestCases;

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
  // Prevent setting `eslintCompat: false`

  constructor(config?: Config) {
    assert(
      config == null || !("eslintCompat" in config),
      "Cannot set `eslintCompat` property of config",
    );
    super(config);
  }

  static setDefaultConfig(config: Config): void {
    if (typeof config !== "object" || config === null) {
      throw new TypeError("`config` must be an object");
    }

    assert(!("eslintCompat" in config), "Cannot set `eslintCompat` property of config");

    super.setDefaultConfig({ ...config, eslintCompat: true });
  }

  static resetDefaultConfig() {
    // Clone, so that user can't get `DEFAULT_SHARED_CONFIG` with `getDefaultConfig()` and modify it
    super.setDefaultConfig({ ...DEFAULT_SHARED_CONFIG });
  }

  run(ruleName: string, rule: Rule, tests: TestCases): void {
    for (const test of tests.valid.concat(tests.invalid)) {
      if (typeof test === "string") continue;

      assert(!("eslintCompat" in test), "Cannot set `eslintCompat` property of test case");
    }

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

export { RuleTesterShim as RuleTester };
