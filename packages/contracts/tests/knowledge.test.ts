import { describe, expect, it } from 'vitest';
import {
  AnswerFeedbackRequestSchema,
  KnowledgeAskRequestSchema,
  KnowledgeAskResponseSchema,
} from '../src/index';

describe('Lasem Guru contracts', () => {
  it('parses ask request', () => {
    const parsed = KnowledgeAskRequestSchema.parse({
      message: 'What is Fictional Lattice A used for in the demo?',
      locale: 'en',
    });
    expect(parsed.message.length).toBeGreaterThan(0);
    expect(parsed.locale).toBe('en');
  });

  it('rejects empty ask message', () => {
    expect(() => KnowledgeAskRequestSchema.parse({ message: '  ' })).toThrow();
  });

  it('parses feedback request', () => {
    const parsed = AnswerFeedbackRequestSchema.parse({
      assistantRunId: '11111111-1111-4111-8111-111111111111',
      kind: 'useful',
    });
    expect(parsed.kind).toBe('useful');
  });

  it('validates ask response shape', () => {
    const parsed = KnowledgeAskResponseSchema.parse({
      sessionId: '11111111-1111-4111-8111-111111111111',
      userMessageId: '11111111-1111-4111-8111-111111111112',
      assistantMessageId: '11111111-1111-4111-8111-111111111113',
      assistantRunId: '11111111-1111-4111-8111-111111111114',
      answerText: 'DEMO / FICTIONAL — NOT RESEARCH DATA. grounded',
      groundingResult: 'insufficient_evidence',
      evidenceLabel: 'insufficient_evidence',
      confidence: 'none',
      provider: 'mock',
      model: 'bcip-mock-grounded-v1',
      promptVersion: 'lasem-guru-prompt-v1',
      policyVersion: 'lasem-guru-policy-v1',
      citations: [],
    });
    expect(parsed.citations).toEqual([]);
  });
});
