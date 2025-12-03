/**
 * ESLint Rule Tester Conformance Script
 *
 * This script runs ESLint's rule tests using Oxlint's RuleTester to verify API compatibility.
 *
 * It works by:
 * 1. Intercepting `require()` calls to replace ESLint's `RuleTester` with Oxlint's.
 * 2. Hooking `describe` and `it` to capture test results.
 * 3. Loading each ESLint rule test file.
 * 4. Recording success/failure of each test.
 * 5. Outputting results to a markdown file.
 */

import Module from "node:module";
import { join as pathJoin } from "node:path";
import fs from "node:fs";
import { runAllTests, CONFORMANCE_DIR_PATH } from "./run.ts";
import { generateReport } from "./report.ts";
import { RuleTester } from "./rule_tester.ts";

// NodeJS's `assert` seems to produce garbled error messages when colors are enabled in some cases.
// Stop it using control characters.
process.env.FORCE_COLOR = "0";

// Patch `Module._load` to intercept requires and substitute ESLint's `RuleTester` for our own
const originalLoad = (Module as any)._load;
(Module as any)._load = function (request: string, parent: unknown, isMain: boolean): unknown {
  // Intercept RuleTester requires - ESLint exports the class directly (module.exports = RuleTester)
  if (request.includes("rule-tester/rule-tester") || request.includes("rule-tester\\rule-tester")) {
    return RuleTester;
  }

  // FlatRuleTester also exports the class directly
  if (
    request.includes("rule-tester/flat-rule-tester") ||
    request.includes("rule-tester\\flat-rule-tester")
  ) {
    return RuleTester;
  }

  return originalLoad.call(this, request, parent, isMain);
};

// Run tests
const results = runAllTests();

// Write results to markdown file
const OUTPUT_FILE_PATH = pathJoin(CONFORMANCE_DIR_PATH, "snapshot.md");

// oxlint-disable no-console

const report = generateReport(results);
fs.writeFileSync(OUTPUT_FILE_PATH, report);
console.log(`\nResults written to: ${OUTPUT_FILE_PATH}`);

// Print summary
const totalRuleCount = results.length;
const fullyPassingCount = results.filter(
  (r) => !r.isLoadError && r.tests.length > 0 && r.tests.every((t) => t.isPassed),
).length;
const loadErrorCount = results.filter((r) => r.isLoadError).length;

console.log("\n=====================================");
console.log("Summary:");
console.log(`  Total rules: ${totalRuleCount}`);
console.log(`  Fully passing: ${fullyPassingCount}`);
console.log(`  Load errors: ${loadErrorCount}`);
console.log(`  With failures: ${totalRuleCount - fullyPassingCount - loadErrorCount}`);
