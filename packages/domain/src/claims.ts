import { assertClaimProvenance, assertDemoFictionalLabel } from './access';

export function validateNewKnowledgeClaim(input: {
  statement: string;
  reviewStatus: string;
  sourceFragmentIds: string[];
  isDemoFictional: boolean;
}): void {
  if (input.isDemoFictional) {
    assertDemoFictionalLabel(input.statement);
  }
  assertClaimProvenance(input);
}
