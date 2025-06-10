import { useAtom, useAtomValue } from "jotai";
import { errorsAtom, authAtom } from "./state";
import useSWR, { useSWRConfig } from "swr";
import type { Treaty } from "server/interface";
import { makeTreaty } from "./treaty";
import type { FetchedJoincode, Joincode, PublicUser, VaultInfoWithSize } from "server/db/schema";
import { wrapError } from "./helpers";
import { useMemo } from "react";

export function usePushError() {
  const [_, setError] = useAtom(errorsAtom);

  return (err: Error) => {
    console.log(err);
    setError(err);
  }
}


export function useTreaty(): Treaty {
  const auth = useAtomValue(authAtom);
  return makeTreaty(auth?.session.token);
}


export function useVaults() {
  console.log("calling use vaults");
  const treaty = useTreaty();
  const pushError = usePushError();
  const { mutate } = useSWRConfig();

  const fetcher = useMemo(() => async (): Promise<VaultInfoWithSize[]> => {
    console.log("Fetching vaults");
    const { data, error } = await treaty.vaults.get();

    if (error !== null) {
      pushError(wrapError("Error fetching vaults", error));
      return []
    }

    return data;
  }, [treaty, pushError]);

  const { data, isLoading } = useSWR("/vaults", fetcher);

  const createVault = useMemo(() => async (vaultName: string, directory: string) => {
    const { error } = await treaty.vaults.post({
      vaultName,
      directory,
    });
    mutate("/vaults");

    if (error !== null) {
      pushError(wrapError("Error creating vault:", error.value));
    }

  }, [treaty, pushError])

  return {
    vaults: data ?? [],
    loading: isLoading,
    createVault,
  };
}

export function useUsers(): { users: PublicUser[], loading: boolean } {
  console.log("calling use users");
  const treaty = useTreaty();
  const pushError = usePushError();

  const fetcher = useMemo(() => async (): Promise<PublicUser[]> => {
    const { data, error } = await treaty.users.get();

    if (error !== null) {
      pushError(wrapError("Error fetching users", error));
      return [];
    }

    return data;
  }, [treaty, pushError]);

  const { data, isLoading } = useSWR("/users", fetcher);

  return {
    users: data ?? [],
    loading: isLoading,
  }
}


export interface JoincodesHook {
  loading: boolean;
  joincodes: FetchedJoincode[];
  createJoincode(role: string): Promise<Joincode | null>;
  deleteJoincode(code: string): Promise<void>;
}


export function useJoincodes(): JoincodesHook {
  console.log("calling use joincode");
  const treaty = useTreaty();
  const pushError = usePushError();
  const { mutate } = useSWRConfig();

  const createJoincode = useMemo(() => async (role: string): Promise<Joincode | null> => {
    const { data, error } = await treaty.joincodes.post({ role });

    if (error !== null) {
      pushError(wrapError("Error creating joincode", error));
    }

    mutate("/joincodes");
    return data;
  }, [treaty, pushError, mutate])

  const deleteJoincode = useMemo(() => async (code: string): Promise<void> => {
    const { error } = await treaty.joincodes({ code: code }).delete();

    if (error !== null) {
      pushError(wrapError("Error deleting joincode", error));
    }

    mutate("/joincodes");
  }, [pushError]);

  const fetcher = useMemo(() => async () => {
    const { data, error } = await treaty.joincodes.get();

    if (error !== null) {
      pushError(wrapError("Error fetching joincodes", error));
    }

    return data ?? [];
  }, [treaty, pushError]);

  const { data: joincodes, isLoading } = useSWR("/joincodes", fetcher);


  return {
    createJoincode,
    deleteJoincode,
    joincodes: joincodes ?? [],
    loading: isLoading,
  }
}



export function useSpecificVault(vaultName: string): [VaultInfoWithSize | null, boolean] {
  const treaty = useTreaty();
  const pushError = usePushError();

  const infoFetcher = async () => {
    const { data, error } = await treaty.vaults({ vault: vaultName }).get();

    if (error !== null) {
      throw error;
    }

    return data;
  }

  const { data: info, error: infoError, isLoading: infoLoading } = useSWR(`vaults/${vaultName}/info`, infoFetcher)


  if (infoError) {
    pushError(wrapError("Error fetching vault info:", infoError));

    return [null, false];
  }

  if (infoLoading === true) {
    return [null, true];
  }

  return [info!, false];
}



export type FetchedFilesystem = { file: string, isDirectory: boolean, size: number }[];

export function useVaultFilesystem(vaultName: string): FetchedFilesystem {
  const treaty = useTreaty();
  const pushError = usePushError();

  const fetchDirectories = useMemo(() => async () => {
    const { data, error } = await treaty.vaults({ vault: vaultName }).listdir.get();

    if (error) {
      throw error;
    }
    return data;
  }, [treaty]);

  const { data, error } = useSWR(`/vaults/${vaultName}/dirlist`, fetchDirectories);
  if (error) {
    pushError(wrapError("Error fetching dirlist", error));
    return [];
  }

  return data ?? [];
}

export function useVaultAccess() {

}
