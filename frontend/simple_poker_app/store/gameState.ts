import { atom } from 'jotai'
import { Game } from '@/lib/types'

export const gamesAtom = atom<Game[]>([])
export const gamesIsLoadingAtom = atom<boolean>(false)
export const gamesErrorAtom = atom<string | null>(null)

export const lobbyInitAtom = atom<boolean>(false)
export const lobbyIsLoadingAtom = atom<boolean>(false)
export const lobbyErrorAtom = atom<string | null>(null)
