import { getTreaty } from "server/interface";

export interface Client {
  token: string;
  expiresAt: number;
  url: string;
}

export async function makeClient(url: string, username: string, password: string): Promise<Client> {
  const treaty = getTreaty(url);

  const { data, error } = await treaty.tokens.post({ username, password });

  if (error !== null) {
    throw new Error(`Error signing in: ${error}`);
  }
}

