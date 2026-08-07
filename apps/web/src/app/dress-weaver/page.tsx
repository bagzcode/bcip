import Link from 'next/link';
import { Badge, Button } from '@bcip/ui';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { listDesignProjects, listGarmentTemplates } from '@/lib/dress-weaver';
import { createDesignProjectAction } from '@/lib/dress-weaver-actions';
import { redirect } from 'next/navigation';

async function createProject(formData: FormData) {
  'use server';
  const title = String(formData.get('title') ?? '').trim();
  const garmentTemplateCode = String(formData.get('garmentTemplateCode') ?? '').trim();
  const result = await createDesignProjectAction({ title, garmentTemplateCode });
  if (result.ok && result.data?.publicCode) {
    redirect(`/dress-weaver/${result.data.publicCode}`);
  }
}

export default async function DressWeaverPage() {
  const locale = await getLocale();
  const actor = await getActorContext();
  const [templates, projects] = await Promise.all([
    listGarmentTemplates(actor),
    listDesignProjects(actor),
  ]);

  return (
    <section className="dw-landing">
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <h1 style={{ marginTop: '0.75rem' }}>{t(locale, 'dressWeaverTitle')}</h1>
      <p style={{ maxWidth: '42rem', color: 'var(--bcip-muted)' }}>
        {t(locale, 'dressWeaverBlurb')}
      </p>
      <p style={{ maxWidth: '42rem' }}>{t(locale, 'dressWeaverIntro')}</p>

      <div className="panel">
        <h2>{t(locale, 'dressWeaverDemoProject')}</h2>
        <p className="dw-muted">{t(locale, 'dressWeaverOpenDemoHint')}</p>
        <ul className="motif-list">
          {projects.map((project) => (
            <li key={project.publicCode} className="motif-item">
              <div style={{ fontSize: '0.85rem', color: 'var(--bcip-muted)' }}>
                {project.publicCode}
              </div>
              <h3 style={{ margin: '0.25rem 0' }}>{project.title}</h3>
              <p style={{ margin: 0 }}>
                {project.garmentTemplateTitle} · v{project.latestVersionNumber ?? '—'}
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                <Link href={`/dress-weaver/${project.publicCode}`}>
                  {t(locale, 'dressWeaverOpenWorkspace')}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h2>{t(locale, 'dressWeaverTemplates')}</h2>
        <ul className="motif-list">
          {templates.map((template) => (
            <li key={template.publicCode} className="motif-item">
              <div style={{ fontSize: '0.85rem', color: 'var(--bcip-muted)' }}>
                {template.publicCode}
              </div>
              <h3 style={{ margin: '0.25rem 0' }}>{template.title}</h3>
              <p style={{ margin: 0 }}>{template.description}</p>
              <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--bcip-muted)' }}>
                {template.canvasWidth}×{template.canvasHeight} · {template.regions.length} regions
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h2>{t(locale, 'dressWeaverNewProject')}</h2>
        <form action={createProject} className="dw-new-form">
          <label className="dw-field">
            <span>{t(locale, 'dressWeaverProjectTitle')}</span>
            <input
              name="title"
              required
              maxLength={200}
              defaultValue="DEMO / FICTIONAL: New placement"
            />
          </label>
          <label className="dw-field">
            <span>{t(locale, 'dressWeaverSelectTemplate')}</span>
            <select name="garmentTemplateCode" required defaultValue={templates[0]?.publicCode}>
              {templates.map((template) => (
                <option key={template.publicCode} value={template.publicCode}>
                  {template.title}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">{t(locale, 'dressWeaverCreate')}</Button>
        </form>
      </div>
    </section>
  );
}
