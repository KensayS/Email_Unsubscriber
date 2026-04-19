import { buildSubjectSnippet } from '@/lib/summary'

describe('buildSubjectSnippet', () => {
  it('joins first 2 subjects with ·', () => {
    const result = buildSubjectSnippet(['Sale: 50% off', 'New arrivals', 'Extra'], 'news@nike.com')
    expect(result).toBe('Sale: 50% off · New arrivals')
  })

  it('returns single subject when only one exists', () => {
    const result = buildSubjectSnippet(['Weekly digest'], 'noreply@medium.com')
    expect(result).toBe('Weekly digest')
  })

  it('falls back to domain when subjects is empty', () => {
    const result = buildSubjectSnippet([], 'noreply@github.com')
    expect(result).toBe('github.com')
  })

  it('falls back to full email when no @ present', () => {
    const result = buildSubjectSnippet([], 'unknown')
    expect(result).toBe('unknown')
  })
})
