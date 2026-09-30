import { getLastShadow, resumeUrl, setLastShadow } from './lastShadow'

describe('resume shadowing', () => {
  it('remembers the last clip per language and builds its link', () => {
    expect(getLastShadow('fr')).toBeNull()
    setLastShadow('fr', { week: 3, id: 'native:334217', text: 'Préférez-vous le thé ou le café ?' })
    const v = getLastShadow('fr')!
    expect(v).toMatchObject({ week: 3, id: 'native:334217' })
    expect(resumeUrl(v)).toBe('/shadowing?week=3&clip=native%3A334217')
    expect(getLastShadow('es')).toBeNull()
  })

  it('ignores damaged saved data', () => {
    localStorage.setItem('parlons.lastShadow.fr', '{not json')
    expect(getLastShadow('fr')).toBeNull()
  })
})
