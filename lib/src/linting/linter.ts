import { flatten } from "lodash";
import { ContractNode } from "../models/nodes";
import { LintingRuleViolation } from "./rule";
import { availableRules, RuleName } from "./rules";

export function lint(
  contract: ContractNode,
  ruleNames: RuleName[] = Object.keys(availableRules) as RuleName[]
): LintingRuleViolation[] {
  return flatten(
    ruleNames
      .map(ruleName => availableRules[ruleName])
      .map(rule => rule(contract))
  );
}
