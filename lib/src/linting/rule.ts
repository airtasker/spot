import { Contract } from "../definitions";

/**
 * A linting rule is a function that returns a list of violations, which will
 * be empty when the rule is complied with.
 */
export type LintingRule = (contract: Contract) => LintingRuleViolation[];

export interface LintingRuleViolation {
  message: string;
}

export interface GroupedLintRuleViolations {
  name: string;
  violations: LintingRuleViolation[];
}
