import { describe, expect, it } from 'vitest'
import { countProfanity, countWords, topIntensity } from '../lexicon.js'

describe('lexicon', () => {
  it('counts deterministic fuzzy profanity variants', () => {
    const matches = countProfanity('f u c k this shiiiit, damn')

    expect(matches.reduce((sum, match) => sum + match.count, 0)).toBe(3)
    expect(topIntensity(matches)).toBe('strong')
  })

  it('does not count allowlisted substrings', () => {
    expect(countProfanity('classic assembly class assignment')).toEqual([])
  })

  it('counts words independently from profanity matching', () => {
    expect(countWords("I can't believe this build broke again")).toBe(7)
  })
})
