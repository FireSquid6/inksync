import { getTreaty } from "server/interface";

export function makeTreaty(token?: string) {
  const hosturl = window.location.protocol + "//" + window.location.host;
  const url = import.meta.env.PROD ? hosturl : "http://localhost:3120";
  const api = getTreaty(url, token);


  return api
}

export type Treaty = ReturnType<typeof makeTreaty>;
