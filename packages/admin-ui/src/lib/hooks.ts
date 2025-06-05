import { useAtom, useAtomValue } from "jotai";
import { errorsAtom, authAtom } from "./state";
import useSWR, { useSWRConfig } from "swr";
import type { Treaty } from "server/interface";
import { makeTreaty } from "./treaty";
import type { Joincode, PublicUser, VaultInfoWithSize } from "server/db/schema";
import { wrapError } from "./helpers";

export function usePushError() {
  const [_, setError] = useAtom(errorsAtom);

  return (err: Error) => {
    setError(err);
  }
}


export function useTreaty(): Treaty {
  const auth = useAtomValue(authAtom);
  return makeTreaty(auth?.session.token);
}

export function useVaults(): { vaults: VaultInfoWithSize[], loading: boolean } {
  const treaty = useTreaty();
  const pushError = usePushError();

  const fetcher = async (): Promise<VaultInfoWithSize[]> => {
    console.log("Fetching vaults");
    const { data, error } = await treaty.vaults.get();

    if (error !== null) {
      pushError(wrapError("Error fetching vaults", error));
      return []
    }

    return data;
  }

  const { data, isLoading } = useSWR("/vaults", fetcher);

  return {
    vaults: data ?? [],
    loading: isLoading,
  };
}

export function useUsers(): { users: PublicUser[], loading: boolean } {
  const treaty = useTreaty();
  const pushError = usePushError(); 

  const fetcher = async (): Promise<PublicUser[]> => {
    const { data, error } = await treaty.users.get();

    if (error !== null) {
      pushError(wrapError("Error fetching users", error));
      return [];
    }

    return data;
  }

  const { data, isLoading } = useSWR("/users", fetcher);

  return {
    users: data ?? [],
    loading: isLoading,
  }
}


export interface JoincodesHook {
  loading: boolean;
  joincodes: Joincode[];
  createJoincode(role: string): Promise<Joincode | null>;
  deleteJoincode(code: string): Promise<void>;
}


export function useJoincodes(): JoincodesHook {
  const treaty = useTreaty();
  const pushError = usePushError();
  const { mutate } = useSWRConfig();

  const createJoincode = async (role: string): Promise<Joincode | null> => {
    const { data, error } = await treaty.joincodes.post({ role });

    if (error !== null) {
      pushError(wrapError("Error creating joincode", error));
    }

    mutate("/joincodes");
    return data;
  }

  const deleteJoincode = async (code: string): Promise<void> => {
    pushError(wrapError("Error deleting joincode", new Error("Joincode deletion not implemented yet")));
  }

  const fetcher = async () => {
    const { data, error } = await treaty.joincodes.get();

    if (error !== null) {
      pushError(wrapError("Error fetching joincodes", error));
    }

    mutate("/joincodes");
    return data ?? [];
  }

  const { data: joincodes, isLoading } = useSWR("/joincodes", fetcher);


  return {
    createJoincode,
    deleteJoincode,
    joincodes: joincodes ?? [],
    loading: isLoading,
  }
}
