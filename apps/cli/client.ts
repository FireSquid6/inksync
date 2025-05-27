import path from "path";
import fs from "fs";
import { CLIENT_CONNECTFILE, INKSYNC_DIRECTORY_NAME } from "libinksync/constants";
import { VaultClient, getDirectoryClient } from "libinksync/client";
import { writeConnectfile, readConnectfile } from "libinksync/client/connectfile";
import type { SyncResult } from "libinksync/client/results";
import { consoleLogger } from "libinksync/logger";


export function getClient(directory: string): VaultClient | null {
  const logger = consoleLogger();
  const connectfilePath = path.join(directory, INKSYNC_DIRECTORY_NAME, CLIENT_CONNECTFILE);
  if (!fs.existsSync(connectfilePath)) {
    return null;
  }

  const connectfile = readConnectfile(connectfilePath);

  const client = getDirectoryClient(connectfile.name, connectfile.address, directory, logger);
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
