import { GroupedLintRuleViolations } from "./rule";
import { LintConfig } from "../../../cli/src/commands/lint";

interface FindLintViolationsDependencies {
  error: (msg: string) => void;
  warn: (msg: string) => void;
}

export interface FindLintViolationsResult {
  errorCount: number;
  warningCount: number;
}

/**
 * Responsible for triggering error or warn depending on whether the lint rule
 * violation setting is 'off', 'warn' or 'error'.
 *
 * By default, if a lint rule setting is not set in lintConfig,
 * then it will be considered a error.
 */
export const findLintViolations = (
  groupedLintErrors: GroupedLintRuleViolations[],
  lintConfig: LintConfig,
  { error, warn }: FindLintViolationsDependencies
): FindLintViolationsResult => {
  let errorCount = 0;
  let warningCount = 0;

  groupedLintErrors.forEach(lintingErrors => {
    const ruleSetting = lintConfig["rules"][lintingErrors.name] ?? "error";

    switch (ruleSetting) {
      case "error": {
        lintingErrors.violations.forEach(lintError => {
          error(lintError.message);
          errorCount++;
        });
        break;
      }

      case "warn": {
        lintingErrors.violations.forEach(lintWarning => {
          warn(lintWarning.message);
          warningCount++;
        });
        break;
      }

      case "off": {
        break;
      }

      default: {
        error(
          `Unknown lint rule setting for ${lintingErrors.name}: ${ruleSetting}`
        );
        errorCount++;
      }
    }
  });

  return {
    errorCount,
    warningCount
  };
};
