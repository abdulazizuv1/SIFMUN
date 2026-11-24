import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { firebaseConfig, firebaseReady } from '../lib/env'
import { seed } from './seed'
import type { Committee, Content, Season, SeasonCommittee } from './types'

/* The public site reads all of its content from here.
   Order of sources, fastest first:
   1. the last content this browser saw (so a returning visitor sees no flicker),
   2. otherwise the seed file,
   3. then, in the background, the live database replaces it.
   If Firebase is not configured, not reachable, or still empty, the seed stays. */

type Derived = {
  pastSeasons: Season[]
  upcoming: Season | undefined
  totalParticipants: number
  committeeById: Map<string, Committee>
  /** The upcoming season's committees, in the season's order, each joined with its committee. */
  upcomingCommittees: { sc: SeasonCommittee; committee: Committee }[]
  /** How many different committees have run so far. */
  pastCommitteeCount: number
  /** Season numbers each committee ran in, oldest first. */
  seasonsOfCommittee: (committeeId: string) => number[]
  /** Asks the provider to read the database again (used after the admin saves). */
  refresh: () => void
}

type Store = Content & Derived

// One cache per Firebase project, so a test project can never leak into the real one.
const CACHE_KEY = `sifmun.content.v1.${firebaseConfig.projectId ?? 'none'}`
const Ctx = createContext<Store | null>(null)

function readCache(): Content | null {
  if (!firebaseReady) return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Content
    return parsed && parsed.settings && Array.isArray(parsed.seasons) ? parsed : null
  } catch {
    return null
  }
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content>(() => readCache() ?? seed)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!firebaseReady) return
    let alive = true
    // Loaded on demand so the first paint never waits for the database code.
    import('./remote')
      .then((m) => m.loadContent())
      .then((remote) => {
        if (!alive) return
        if (!remote) {
          // The database is empty: forget any stale copy and show the seed.
          try {
            localStorage.removeItem(CACHE_KEY)
          } catch {
            /* ignore */
          }
          setContent(seed)
          return
        }
        setContent(remote)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(remote))
        } catch {
          /* storage full or blocked: the page still works */
        }
      })
      .catch(() => {
        /* offline or blocked by rules: keep what is already on screen */
      })
    return () => {
      alive = false
    }
  }, [tick])

  const store = useMemo<Store>(() => {
    const seasons = [...content.seasons].sort((a, b) => a.number - b.number)
    const pastSeasons = seasons.filter((s) => s.status === 'past')
    const upcoming =
      seasons.find((s) => s.number === content.settings.upcomingSeason) ??
      seasons.find((s) => s.status === 'upcoming')
    const committees = [...content.committees].sort((a, b) => a.order - b.order)
    const committeeById = new Map(committees.map((c) => [c.id, c]))
    return {
      ...content,
      seasons,
      committees,
      pastSeasons,
      upcoming,
      totalParticipants: pastSeasons.reduce((sum, s) => sum + (s.participants ?? 0), 0),
      committeeById,
      upcomingCommittees: (upcoming?.committees ?? []).flatMap((sc) => {
        const committee = committeeById.get(sc.committeeId)
        return committee ? [{ sc, committee }] : []
      }),
      pastCommitteeCount: new Set(pastSeasons.flatMap((s) => s.committees.map((c) => c.committeeId))).size,
      seasonsOfCommittee: (id) =>
        pastSeasons.filter((s) => s.committees.some((c) => c.committeeId === id)).map((s) => s.number),
      refresh: () => setTick((n) => n + 1),
    }
  }, [content])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useContent(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useContent must be used inside ContentProvider')
  return ctx
}
