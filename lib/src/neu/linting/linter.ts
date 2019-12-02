import { Contract } from "../definitions";
import { LintingRuleViolation } from "./rule";
import { availableRules } from "./rules";

export function lint(contract: Contract): LintingRuleViolation[] {
  return Object.keys(availableRules).reduce<LintingRuleViolation[]>(
    (acc, ruleName) => acc.concat(availableRules[ruleName](contract)),
    []
  );
}
