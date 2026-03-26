import { describe, it, expect, afterEach } from 'vitest'
import { isLtiLaunch, getLtiParams } from '../lti'

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search },
    writable: true,
  })
}

afterEach(() => {
  setSearch('')
})

describe('isLtiLaunch', () => {
  it('returns true when lti=1 is in the URL', () => {
    setSearch('?lti=1')
    expect(isLtiLaunch()).toBe(true)
  })

  it('returns false when lti param is absent', () => {
    setSearch('')
    expect(isLtiLaunch()).toBe(false)
  })

  it('returns false when lti param is not 1', () => {
    setSearch('?lti=0')
    expect(isLtiLaunch()).toBe(false)
  })
})

describe('getLtiParams', () => {
  it('returns null when not an LTI launch', () => {
    setSearch('')
    expect(getLtiParams()).toBeNull()
  })

  it('extracts sub, name, and course from URL', () => {
    setSearch('?lti=1&sub=user-123&name=Alice&course=POLS101')
    const params = getLtiParams()
    expect(params).toEqual({ sub: 'user-123', name: 'Alice', course: 'POLS101' })
  })

  it('defaults missing fields to empty strings', () => {
    setSearch('?lti=1')
    const params = getLtiParams()
    expect(params).toEqual({ sub: '', name: '', course: '' })
  })
})
