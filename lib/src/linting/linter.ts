import { Contract } from "../definitions";
import { GroupedLintRuleViolations } from "./rule";
import { availableRules } from "./rules";

export function lint(contract: Contract): GroupedLintRuleViolations[] {
  return Object.keys(availableRules).reduce<GroupedLintRuleViolations[]>(
    (acc, ruleName) =>
      acc.concat({
        name: ruleName,
        violations: availableRules[ruleName](contract)
      }),
    []
  );
}
