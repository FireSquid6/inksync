import { Elysia, t } from "elysia";
import { failingTracker, getDirectoryTracker } from "./tracker";
import { defaultConfig } from "./config";
import { makeMessage, parseMessage, type Update, type Message } from "..";
import { compressFile, decompressFile } from "../compress";
import { tokenIsValid } from "./auth";
import type { ElysiaWS } from "elysia/ws";
import type { Tracker } from "./tracker";

const CHANNEL_NAME = "MESSAGES";

interface MessageContext {
  message: Message,
  ws: ElysiaWS,
  authenticatedSocketIds: Set<string>,
  tracker: Tracker
}

async function processMessage(ctx: MessageContext) {
  const { message, ws, authenticatedSocketIds, tracker } = ctx;

  switch (message.type) {
    case "AUTHENTICATE":
      if (tokenIsValid(message.token)) {
        authenticatedSocketIds.add(message.token);
        ws.subscribe(CHANNEL_NAME);
        console.log(`  Authenticated ${ws.id}`);
        ws.send(makeMessage({
          type: "AUTHENTICATED",
        }));

      } else {
        console.log(`  Authentication failed for ${ws.id}`);
        ws.send(makeMessage({
          type: "ERROR",
          info: "Token was unable to be validated",
        }));
      }
      break;
    case "PUSH_UPDATES":
      for (const update of message.updates) {
        const lastUpdated = await tracker.getLastUpdate(update.filepath);

        if (lastUpdated !== null && lastUpdated >= update.lastUpdate) {
          console.log("  Recieved outdated updates");
          ws.send(makeMessage({
            type: "OUTDATED",
            filepath: update.filepath,
          }));
          return;
        }
      }


      await Promise.all(message.updates.map(async (u) => {
        const decompressed = decompressFile(u.content)
        await tracker.pushUpdate(u.filepath, decompressed);

        return Promise.resolve();
      }));


      console.log(`  Update successful!`)
      ws.send(makeMessage({
        type: "UPDATE_SUCCESSFUL",
      }))

      ws.publish(CHANNEL_NAME, makeMessage({
        type: "UPDATED",
        updates: message.updates.map((u) => {
          return {
            filepath: u.filepath,
            content: u.content,
            lastUpdate: Date.now(),
          }
        }),
      }))

      break;
    case "FETCH_UPDATED_SINCE":
      const trackerfile = await tracker.getPathsUpdatedSince(message.timestamp);

      const updates = await Promise.all(trackerfile.map(async (t): Promise<Update> => {
        const content = await tracker.getCurrentContent(t.filepath);

        if (content === null) {
          throw new Error("Somehow failed to get content for a file that is supposed to exist");
        }

        const compressed = compressFile(content);
        return {
          filepath: t.filepath,
          lastUpdate: t.last_updated,
          content: compressed,
        }
      }));

      console.log(`  Returning ${updates.length} updates`);

      ws.send({
        type: "UPDATED",
        updates,
      })

      break;
    default:
      console.log("  Bad message type.")
      ws.send(makeMessage({
        type: "ERROR",
        info: `Message of type ${message.type} shouldn't be sent to the sever`,
      }));
  }
}

  export const app = new Elysia()
    .state("tracker", failingTracker())
    .state("config", defaultConfig())
    .state("authenticatedSocketIds", new Set<string>())
    .ws("listen", {
      body: t.Object({
        message: t.String(),
      }),
      message: async (ws, { message: rawMessage }) => {
        const { authenticatedSocketIds, tracker } = ws.data.store;
        const id = ws.id;
        const message = parseMessage(rawMessage);
        if (message instanceof Error) {
          ws.send(makeMessage({
            type: "ERROR",
            info: message.message,
          }));
          return;
        }

        if (!authenticatedSocketIds.has(id) && message.type !== "AUTHENTICATE") {
          ws.send(makeMessage({
            type: "ERROR",
            info: "Not authenticated",
          }));
        }

        console.log(`PROCESSING ${message.type}:`)

        try {
          await processMessage({ message, ws, authenticatedSocketIds, tracker });
        } catch (e) {
          console.log(`  Unhandled error processing: ${e}`);
          ws.send(makeMessage({
            type: "ERROR",
            info: `Uncaught error: ${(e as Error).message}`,
          }));
        }

      },
      close: (ws) => {
        const { authenticatedSocketIds } = ws.data.store;
        authenticatedSocketIds.delete(ws.id);
      }
    })


  export function startApp(directory: string) {
    app.store.tracker = getDirectoryTracker(directory);

    const port = app.store.config.port;

    app.listen(port, () => {
      console.log(`Started in ${directory} on ${port}`);
    });
  }
