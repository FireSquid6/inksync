import { CLIENT_CONNECTFILE, INKSYNC_DIRECTORY_NAME, writeConnectfile, readConnectfile, VaultClient, getDirectoryClient } from "libinksync";
import path from "path";
import fs from "fs";
import type { SyncResult } from "libinksync/src/client/results";


export function getClient(directory: string): VaultClient | null {
  const connectfilePath = path.join(directory, INKSYNC_DIRECTORY_NAME, CLIENT_CONNECTFILE);
  if (!fs.existsSync(connectfilePath)) {
    return null;
  }

  const connectfile = readConnectfile(connectfilePath);

  const client = getDirectoryClient(connectfile.name, connectfile.address, directory);
  return client;
}

export function setConnectfile(directory: string, vault: string, address: string) {
  const connectfilePath = path.join(directory, INKSYNC_DIRECTORY_NAME, CLIENT_CONNECTFILE);
  writeConnectfile(connectfilePath, { name: vault, address });
}

export function logResult(filepath: string, syncResult: SyncResult) {
  const indicator = syncResult.domain === "good" ? "SUCCESS" : "FAILURE"

  console.log(`${indicator}: ${syncResult.type} for ${filepath}`);
  if (syncResult.type === "server-error" || syncResult.type === "client-error") {
    console.log(`Recieved error: ${syncResult.error}`);
  }
}

export function logResults(results: [string, SyncResult][]) {
  results.map(([f, r]) => logResult(f, r));
}
