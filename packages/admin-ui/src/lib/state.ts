import { atomWithStorage } from "jotai/utils";
import { atom, getDefaultStore, useAtomValue } from "jotai";
import type { PublicUser, Token } from "server/db/schema";
import { makeTreaty, type Treaty } from "./treaty";
import { redirect } from "@tanstack/react-router";
import { usePushError, useTreaty } from "./hooks";

export interface AuthState {
  user: PublicUser;
  session: Token;
}

export const authAtom = atomWithStorage<AuthState | null>("auth", null);
export const errorsAtom = atom<Error | null>(null);


type SignOutCallback = () => Promise<void> | void;

export function useSignOut() {
  const treaty = useTreaty();
  const auth = useAtomValue(authAtom);
  const pushError = usePushError();


  return async (callback?: SignOutCallback) => {
    if (auth === null) {
      pushError(new Error("Tried to sign out when not signed in"));
      return;
    }

    const { error } = await treaty.tokens({ token: auth.session.token }).delete();

    if (error !== null) {
      pushError(new Error(`Error signing out: ${error.value}`));
    }

    if (callback) {
      await callback();
    }
  }
}

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


