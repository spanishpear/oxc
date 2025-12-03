import fs from "node:fs";
import { basename, join as pathJoin } from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";
import { setCurrentRule, resetCurrentRule } from "./capture.ts";

import type { RuleResult } from "./capture.ts";

// Paths
export const CONFORMANCE_DIR_PATH = pathJoin(fileURLToPath(import.meta.url), "../..");
const ESLINT_ROOT_DIR_PATH = pathJoin(CONFORMANCE_DIR_PATH, "submodules/eslint");
const ESLINT_RULES_TESTS_DIR_PATH = pathJoin(ESLINT_ROOT_DIR_PATH, "tests/lib/rules");

// Create require function for loading CommonJS modules
const require = Module.createRequire(import.meta.url);

/**
 * Run all ESLint rule tests.
 */
// oxlint-disable no-console
export function runAllTests(): RuleResult[] {
  console.log("Finding ESLint rule test files...");
  const testFiles = findTestFiles();
  console.log(`Found ${testFiles.length} test files\n`);

  const results = [];
  for (let i = 0; i < testFiles.length; i++) {
    const filePath = testFiles[i];
    const ruleName = getRuleName(filePath);

    process.stdout.write(`[${i + 1}/${testFiles.length}] Testing ${ruleName}...`);

    const result = runRuleTests(filePath);
    results.push(result);

    if (result.isLoadError) {
      console.log(" LOAD ERROR");
    } else {
      const passed = result.tests.filter((t) => t.isPassed).length;
      const total = result.tests.length;
      const status = passed === total ? "PASS" : "FAIL";
      console.log(` ${status} (${passed}/${total})`);
    }
  }

  return results;
}
// oxlint-enable no-console

/**
 * Find all ESLint rule test files.
 */
function findTestFiles(): string[] {
  const files = fs.readdirSync(ESLINT_RULES_TESTS_DIR_PATH);
  return files
    .filter((f) => f.endsWith(".js") && !f.startsWith("_"))
    .map((f) => pathJoin(ESLINT_RULES_TESTS_DIR_PATH, f))
    .sort();
}

/**
 * Extract rule name from test file path.
 */
function getRuleName(filePath: string): string {
  return basename(filePath, ".js");
}

/**
 * Run tests for a single rule file.
 */
function runRuleTests(filePath: string): RuleResult {
  const ruleName = getRuleName(filePath);

  const result: RuleResult = {
    ruleName,
    filePath,
    isLoadError: false,
    loadError: null,
    tests: [],
  };

  setCurrentRule(result);

  try {
    // Clear require cache for this file to ensure fresh load
    delete require.cache[require.resolve(filePath)];

    // Load the test file - this will execute the tests
    require(filePath);
  } catch (err) {
    result.isLoadError = true;
    result.loadError = err as Error;
  }

  resetCurrentRule();

  return result;
}
