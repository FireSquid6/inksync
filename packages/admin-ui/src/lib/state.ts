import { atomWithStorage } from "jotai/utils";
import { atom, getDefaultStore, useAtom, useAtomValue } from "jotai";
import type { VaultInfoWithSize, PublicUser, Token } from "server/db/schema";
import { makeTreaty, type Treaty } from "./treaty";
import { wrapError } from "./helpers";
import { useState } from "react";
import { redirect } from "@tanstack/react-router";

export interface AuthState {
  user: PublicUser;
  session: Token;
}

export const authAtom = atomWithStorage<AuthState | null>("auth", null);
export const vaultsAtom = atomWithStorage<VaultInfoWithSize[]>("vaults", []);
export const errorsAtom = atom<Error | null>(null);


export function getProtected(): {user: PublicUser, treaty: Treaty } {
  const store = getDefaultStore();
  const auth = store.get(authAtom);

  if (auth === null) {
    throw redirect({to: "/auth"});
  }

  const treaty = makeTreaty(auth.session.token);

  return { 
    user: auth.user, 
    treaty,
  };
}

export function usePushError() {
  const [_, setError] = useAtom(errorsAtom);

  return (err: Error) => {
    setError(err);
  }
}


export function useVaults(initialValue?: VaultInfoWithSize[]) {
  const auth = useAtomValue(authAtom);
  const treaty = makeTreaty(auth?.session.token);
  const pushErr = usePushError();

  const [vaults, setVaults] = useState<VaultInfoWithSize[]>(initialValue ?? []);
  const [loading, setLoading] = useState<boolean>(false);

  async function createVault(vaultName: string, directory: string) {
    return pushErr(wrapError("Error deleting vault", "Creating vaults not implemented yet"));
  }

  async function deleteVault(vaultName: string) {
    return pushErr(wrapError("Error deleting vault", "Delete vault not implemented yet. Cry about it bitch."));
  }

  async function refetchVaults() {
    setLoading(true);
    const { data: newVaults, error } = await treaty.vaults.get();

    if (error !== null) {
      setLoading(false);
      return pushErr(wrapError("Error fetching vaults", error));
    }

    setLoading(false);
    setVaults(newVaults);
  }

  return {
    vaults,
    refetchVaults,
    createVault,
    deleteVault,
  }
}

