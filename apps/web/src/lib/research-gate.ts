import { hasPermission, type ActorContext, type Permission } from '@bcip/domain';
import { getActorContext } from './actor';

export type ResearchGatePermission = Extract<
  Permission,
  'research:read' | 'research:manage' | 'research:collect' | 'research:export'
>;

export type ResearchGateResult = {
  actor: ActorContext;
  allowed: boolean;
  permission: ResearchGatePermission;
};

/** Soft-gate for Research Lab UI. Domain/actions still enforce assertCan. */
export async function softGateResearch(
  permission: ResearchGatePermission = 'research:read',
): Promise<ResearchGateResult> {
  const actor = await getActorContext();
  return {
    actor,
    allowed: hasPermission(actor, permission),
    permission,
  };
}
