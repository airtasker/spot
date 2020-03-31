import { GroupedLintRuleViolations } from "./rule";
import { SpotConfig } from "cli/src/commands/lint";

interface FindLintViolationsDependencies {
  error: (
    msg: string,
    options: {
      code?: string;
      exit: false;
    }
  ) => void;
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
 * By default, if a lint rule setting is not set in spotConfig,
 * then it will be considered a error.
 *
 * Returns the deferExit value which will be true if there is a lint violation
 * error or an unknown rule setting is found. Otherwise it is false.
 */
export const findLintViolations = (
  groupedLintErrors: GroupedLintRuleViolations[],
  spotConfig: SpotConfig,
  { error, warn }: FindLintViolationsDependencies
): FindLintViolationsResult => {
  let errorCount = 0;
  let warningCount = 0;

  groupedLintErrors.forEach(lintingErrors => {
    const ruleSetting = spotConfig["rules"][lintingErrors.name] ?? "error";

    switch (ruleSetting) {
      case "error": {
        lintingErrors.violations.forEach(lintError => {
          error(lintError.message, { exit: false });
        });
        errorCount++;
        break;
      }

      case "warn": {
        lintingErrors.violations.forEach(lintWarning => {
          warn(lintWarning.message);
        });
        warningCount++;
        break;
      }

      case "off": {
        break;
      }

      default: {
        error(
          `Unknown lint rule setting for ${lintingErrors.name}: ${ruleSetting}`,
          { exit: false }
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
