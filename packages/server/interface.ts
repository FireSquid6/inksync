import type { App } from "./http";
import { treaty } from "@elysiajs/eden";
import type { SuccessfulUpdate } from "libinksync/vault";
import type { Update } from "libinksync/store";
import type { VaultApi } from "libinksync/client/api"

export type Treaty = ReturnType<typeof getTreaty>;

export function getTreaty(url: string, token?: string) {
  if (!token) {
    return treaty<App>(url);
  }

  return treaty<App>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
}

export function getApiFromAddress(address: string, name: string, key: string): VaultApi {
  const treaty = getTreaty(address, key);
  return getApiFromTreaty(treaty, name);
}

export function getApiFromTreaty(treaty: Treaty, name: string): VaultApi {
  return {
    getAddress() {
      return "treaty";
    },
    getName() {
      return name;
    },
    async ping(): Promise<string> {
      const res = await treaty.ping.get();

      if (res.error !== null) {
        throw new Error(`Error fetching: ${res.status} ${res.error}`);
      }

      return res.data;
    },
    async updatesSince(time: number): Promise<Update[]> {
      const res = await treaty
        .vaults({ vault: name })
        .updates
        .get({ query: { since: time }});

      if (res.error !== null) {
        throw new Error(`Error fetching: ${res.status}, ${res.error}`)
      }

      return res.data;

    },
    async uploadFile(filepath: string, currentHash: string, file: File | "DELETE"): Promise<SuccessfulUpdate> {
      const res = await treaty
        .vaults({ vault: name })
        .files({ filepath: filepath })
        .post({
          file,
          currentHash,
        });

      if (res.error !== null) {
        throw new Error(`Error fetching: ${res.status}, ${res.error}`);
      }

      return res.data;
    },
    async getFile(filepath: string): Promise<"DELETED" | "NON-EXISTANT" | ArrayBuffer> {
      const res = await treaty
        .vaults({ vault: name })
        .files({ filepath: filepath })
        .get()
      
      if (res.error !== null) {
        throw new Error(`Error fetching: ${res.status}, ${res.error}`);
      }

      return res.data;
    },
    async getUpdate(filepath: string): Promise<"UNTRACKED" | Update> {
      const res = await treaty
        .vaults({ vault: name })
        .updates({ filepath: filepath })
        .get();

      if (res.error !== null || res.data === null) {
        throw new Error(`Error fetching: ${res.status}, ${res.error}`);
      }

      return res.data;
    },

    // TODO
    async getFileStream(_: string): Promise<"DELETED" | "NON-EXISTANT" | ReadableStream> {
      throw new Error(`getFileStream not implemented yet`);
    },
  }
}
