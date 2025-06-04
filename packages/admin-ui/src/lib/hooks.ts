import { useAtom, useAtomValue } from "jotai";
import { errorsAtom, authAtom } from "./state";
import useSWR from "swr";
import type { Treaty } from "server/interface";
import { makeTreaty } from "./treaty";
import type { VaultInfoWithSize } from "server/db/schema";
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
