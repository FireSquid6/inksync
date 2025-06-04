import { getTreaty } from "server/interface";

export function makeTreaty(token?: string) {
  const url = import.meta.env.VITE_SERVER_URL;
  if (url === undefined) {
    throw new Error(`VITE_SERVER_URL was undefined.`);
  }

  const api = getTreaty(url, token);


  return api
}

export type Treaty = ReturnType<typeof makeTreaty>;
