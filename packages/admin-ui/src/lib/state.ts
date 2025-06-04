import { atomWithStorage } from "jotai/utils";
import { atom, getDefaultStore } from "jotai";
import type { PublicUser, Token } from "server/db/schema";
import { makeTreaty, type Treaty } from "./treaty";
import { redirect } from "@tanstack/react-router";

export interface AuthState {
  user: PublicUser;
  session: Token;
}

export const authAtom = atomWithStorage<AuthState | null>("auth", null);
export const errorsAtom = atom<Error | null>(null);


export function getProtected(): { user: PublicUser, treaty: Treaty } {
  const store = getDefaultStore();
  const auth = store.get(authAtom);

  if (auth === null) {
    throw redirect({ to: "/auth" });
  }

  const treaty = makeTreaty(auth.session.token);

  return {
    user: auth.user,
    treaty,
  };
}


