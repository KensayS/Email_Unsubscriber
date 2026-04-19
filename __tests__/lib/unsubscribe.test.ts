import { buildUnsubscribeAction } from '@/lib/unsubscribe'

describe('buildUnsubscribeAction', () => {
  it('returns post action when List-Unsubscribe-Post header is present with URL', () => {
    const result = buildUnsubscribeAction(
      '<https://example.com/unsub>, <mailto:u@example.com>',
      'List-Unsubscribe=One-Click'
    )
    expect(result).toEqual({
      method: 'post',
      url: 'https://example.com/unsub',
    })
  })

  it('returns mailto action when only mailto is present', () => {
    const result = buildUnsubscribeAction(
      '<mailto:unsub@example.com?subject=unsubscribe>',
      undefined
    )
    expect(result).toEqual({
      method: 'mailto',
      address: 'unsub@example.com',
      subject: 'unsubscribe',
    })
  })

  it('returns url action when only URL is present (no Post header)', () => {
    const result = buildUnsubscribeAction('<https://example.com/unsub>', undefined)
    expect(result).toEqual({
      method: 'url',
      url: 'https://example.com/unsub',
    })
  })

  it('returns not_found when both headers are undefined', () => {
    const result = buildUnsubscribeAction(undefined, undefined)
    expect(result).toEqual({ method: 'not_found' })
  })

  it('prefers URL POST over mailto when Post header is present', () => {
    const result = buildUnsubscribeAction(
      '<https://example.com/unsub>',
      'List-Unsubscribe=One-Click'
    )
    expect(result.method).toBe('post')
  })
})
