import { getTreaty } from "server/interface";

export interface VaultDisplay {
  name: string;
  location: string;
  created: Date;
  size: number;
}

export function makeTreaty() {
  const url = import.meta.env.VITE_SERVER_URL;
  if (url === undefined) {
    throw new Error(`VITE_SERVER_URL was undefined.`);
  }

  return getTreaty(url);
}
