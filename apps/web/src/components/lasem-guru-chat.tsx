'use client';

import { useState, useTransition } from 'react';
import type { KnowledgeAskResponse, KnowledgeCitation } from '@bcip/contracts';
import { askLasemGuru, submitAnswerFeedback } from '@/lib/knowledge/actions';
import type { Locale } from '@/i18n/messages';

type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  run?: KnowledgeAskResponse;
};

type Props = {
  locale: Locale;
  labels: {
    demoBadge: string;
    intro: string;
    placeholder: string;
    ask: string;
    asking: string;
    sources: string;
    closeSources: string;
    confidence: string;
    evidence: string;
    grounding: string;
    feedback: string;
    feedbackThanks: string;
    chipsHeading: string;
    noCitations: string;
    useful: string;
    incorrect: string;
    incomplete: string;
    culturallyInappropriate: string;
    permissionConcern: string;
  };
  quickQuestions: string[];
};

function labelEvidence(value: string, locale: Locale): string {
  const map: Record<string, { en: string; id: string }> = {
    documented_claim: { en: 'Documented claim', id: 'Klaim terdokumentasi' },
    contributor_interpretation: {
      en: 'Contributor interpretation',
      id: 'Interpretasi kontributor',
    },
    inference: { en: 'Model inference', id: 'Inferensi model' },
    contested_claim: { en: 'Contested claim', id: 'Klaim dipersengketakan' },
    insufficient_evidence: { en: 'Insufficient evidence', id: 'Bukti tidak cukup' },
  };
  return map[value]?.[locale] ?? value;
}

export function LasemGuruChat({ locale, labels, quickQuestions }: Props) {
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [drawer, setDrawer] = useState<KnowledgeCitation[] | null>(null);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || pending) return;
    setError(null);
    setFeedbackNote(null);
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setTurns((prev) => [...prev, userTurn]);
    setInput('');

    startTransition(async () => {
      const result = await askLasemGuru({
        sessionId,
        message: trimmed,
        locale,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSessionId(result.data.sessionId);
      setTurns((prev) => [
        ...prev,
        {
          id: result.data.assistantMessageId,
          role: 'assistant',
          content: result.data.answerText,
          run: result.data,
        },
      ]);
      if (result.data.citations.length) {
        setDrawer(result.data.citations);
      }
    });
  }

  function onFeedback(
    runId: string,
    kind:
      | 'useful'
      | 'incorrect'
      | 'incomplete'
      | 'culturally_inappropriate'
      | 'permission_concern',
  ) {
    startTransition(async () => {
      const result = await submitAnswerFeedback({
        assistantRunId: runId,
        kind,
      });
      if (result.ok) setFeedbackNote(labels.feedbackThanks);
      else setError(result.message);
    });
  }

  return (
    <div className="lasem-guru">
      <p className="lasem-guru__badge">{labels.demoBadge}</p>
      <p className="lasem-guru__intro">{labels.intro}</p>

      <div className="lasem-guru__chips" aria-label={labels.chipsHeading}>
        <p className="lasem-guru__chips-heading">{labels.chipsHeading}</p>
        <div className="lasem-guru__chip-row">
          {quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              className="lasem-guru__chip"
              disabled={pending}
              onClick={() => send(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="lasem-guru__thread" role="log" aria-live="polite">
        {turns.map((turn) => (
          <article
            key={turn.id}
            className={
              turn.role === 'user' ? 'lasem-guru__bubble lasem-guru__bubble--user' : 'lasem-guru__bubble'
            }
          >
            <pre className="lasem-guru__text">{turn.content}</pre>
            {turn.run ? (
              <div className="lasem-guru__meta">
                <span>
                  {labels.grounding}: {turn.run.groundingResult}
                </span>
                <span>
                  {labels.evidence}: {labelEvidence(turn.run.evidenceLabel, locale)}
                </span>
                <span>
                  {labels.confidence}: {turn.run.confidence}
                </span>
                {turn.run.citations.length > 0 ? (
                  <button
                    type="button"
                    className="lasem-guru__linkish"
                    onClick={() => setDrawer(turn.run!.citations)}
                  >
                    {labels.sources} ({turn.run.citations.length})
                  </button>
                ) : (
                  <span>{labels.noCitations}</span>
                )}
                <div className="lasem-guru__feedback" aria-label={labels.feedback}>
                  {(
                    [
                      ['useful', labels.useful],
                      ['incorrect', labels.incorrect],
                      ['incomplete', labels.incomplete],
                      ['culturally_inappropriate', labels.culturallyInappropriate],
                      ['permission_concern', labels.permissionConcern],
                    ] as const
                  ).map(([kind, label]) => (
                    <button
                      key={kind}
                      type="button"
                      className="lasem-guru__chip"
                      disabled={pending}
                      onClick={() => onFeedback(turn.run!.assistantRunId, kind)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <form
        className="lasem-guru__composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label className="sr-only" htmlFor="lasem-guru-input">
          {labels.placeholder}
        </label>
        <textarea
          id="lasem-guru-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={labels.placeholder}
          rows={3}
          disabled={pending}
        />
        <button type="submit" disabled={pending || !input.trim()}>
          {pending ? labels.asking : labels.ask}
        </button>
      </form>

      {error ? (
        <p className="lasem-guru__error" role="alert">
          {error}
        </p>
      ) : null}
      {feedbackNote ? <p className="lasem-guru__note">{feedbackNote}</p> : null}

      {drawer ? (
        <aside className="lasem-guru__drawer" aria-label={labels.sources}>
          <div className="lasem-guru__drawer-head">
            <h2>{labels.sources}</h2>
            <button type="button" onClick={() => setDrawer(null)}>
              {labels.closeSources}
            </button>
          </div>
          <ul>
            {drawer.map((c) => (
              <li key={c.sourceFragmentId}>
                <div className="lasem-guru__cite-code">{c.sourcePublicCode}</div>
                <div>{c.citation}</div>
                <div className="lasem-guru__cite-key">{c.fragmentKey}</div>
                <p>{c.excerpt}</p>
                <p className="lasem-guru__cite-label">
                  {labelEvidence(c.evidenceLabel, locale)} · {c.accessTier}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}
