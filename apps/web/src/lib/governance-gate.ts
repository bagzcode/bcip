import { hasPermission, type ActorContext, type Permission } from '@bcip/domain';
import { getActorContext } from './actor';

export type GovernanceGatePermission = Extract<
  Permission,
  'governance:read' | 'governance:manage'
>;

export type GovernanceGateResult = {
  actor: ActorContext;
  allowed: boolean;
  permission: GovernanceGatePermission;
};

/**
 * Soft-gate helper for governance UI.
 * Does not throw or redirect — callers show a notice and hide manage controls.
 * Domain services must still call assertCan / hasPermission for real enforcement.
 */
export async function softGateGovernance(
  permission: GovernanceGatePermission = 'governance:read',
): Promise<GovernanceGateResult> {
  const actor = await getActorContext();
  return {
    actor,
    allowed: hasPermission(actor, permission),
    permission,
  };
}

export function canGovernance(
  actor: ActorContext,
  permission: GovernanceGatePermission = 'governance:read',
): boolean {
  return hasPermission(actor, permission);
}
