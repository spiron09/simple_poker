import { atom } from "jotai";
import { Game } from "@/lib/types";

export const gamesAtom = atom<Game[]>([]);

export const isLoadingAtom = atom<boolean>(false);

export const errorAtom = atom<string | null>(null);