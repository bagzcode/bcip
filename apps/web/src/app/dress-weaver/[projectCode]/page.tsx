import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DressWeaverWorkspaceClient } from '@/components/dress-weaver/workspace-client';
import { getActorContext } from '@/lib/actor';
import { getDesignProjectByCode } from '@/lib/dress-weaver';
import { listPlaceableMotifsAction } from '@/lib/dress-weaver-actions';

export default async function DressWeaverProjectPage({
  params,
}: {
  params: Promise<{ projectCode: string }>;
}) {
  const { projectCode } = await params;
  const actor = await getActorContext();
  const project = await getDesignProjectByCode(actor, projectCode);
  if (!project) notFound();

  const motifs = await listPlaceableMotifsAction();

  return (
    <div>
      <p style={{ marginBottom: '1rem' }}>
        <Link href="/dress-weaver">← Dress Weaver</Link>
      </p>
      <DressWeaverWorkspaceClient project={project} motifs={motifs} />
    </div>
  );
}
