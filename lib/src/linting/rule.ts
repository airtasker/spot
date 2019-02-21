import { Locatable } from "../models/locatable";
import { ContractNode } from "../models/nodes";

/**
 * A linting rule is a function that returns a list of violations, which will
 * be empty when the rule is complied with.
 */
export interface LintingRule {
  (contract: ContractNode): LintingRuleViolation[];
}

export interface LintingRuleViolation {
  message: string;
  source: Locatable<unknown>;
}
