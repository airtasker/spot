import { GroupedLintRuleViolations } from "./rule";
import { SpotConfig } from "cli/src/commands/lint";

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
interface HandleLintViolationsDependencies {
  error: (
    msg: string,
    options: {
      code?: string;
      exit: false;
    }
  ) => void;
  warn: (msg: string) => void;
}

export const handleLintViolations = (
  groupedLintErrors: GroupedLintRuleViolations[],
  spotConfig: SpotConfig,
  { error, warn }: HandleLintViolationsDependencies
): boolean => {
  let deferExit = false;

  groupedLintErrors.forEach(lintingErrors => {
    let ruleSetting = spotConfig["rules"][lintingErrors.name];
    if (ruleSetting === undefined) {
      ruleSetting = "error";
    }

    switch (ruleSetting) {
      case "error": {
        lintingErrors.violations.forEach(lintError => {
          error(lintError.message, { exit: false });
        });
        deferExit = true;
        break;
      }

      case "warn": {
        lintingErrors.violations.forEach(lintWarning => {
          warn(lintWarning.message);
        });
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
        deferExit = true;
      }
    }
  });

  return deferExit;
};
