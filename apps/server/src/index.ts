import { z } from "zod";
import { Elysia, t } from "elysia";
import { failingTracker, getDirectoryTracker } from "./track";
import { defaultConfig } from "./config";
import { authenticateSchema, makeMessage, parseMessage } from "inksync-sdk";
import { tokenIsValid } from "./auth";

export const trackedFileSchema = z.object({
  filepath: z.string(),
  last_updated: z.number(),
});


export type TrackedFile = z.infer<typeof trackedFileSchema>

export const trackerFileSchema = z.array(trackedFileSchema);

export type Trackerfile = z.infer<typeof trackerFileSchema>;



const CHANNEL_NAME = "MESSAGES";

export const app = new Elysia()
  .state("tracker", failingTracker())
  .state("config", defaultConfig())
  .state("authenticatedSocketIds", new Set<string>())
  .ws("listen", {
    body: t.Object({
      message: t.String(),
    }),
    message: (ws, { message: rawMessage }) => {
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

      switch (message.type) {
        case "AUTHENTICATE":
          if (tokenIsValid(message.token)) {
            authenticatedSocketIds.add(message.token);
            ws.subscribe(CHANNEL_NAME);
            ws.send(makeMessage({
              type: "AUTHENTICATED",
            }));

          } else {
            ws.send(makeMessage({
              type: "ERROR",
              info: "Token was unable to be validated",
            }));
          }
          break;
        case "PUSH_UPDATES":
          // TODO


          break;
        case "FETCH_UPDATED_SINCE":
          // TODO

          break;
        default:
          ws.send(makeMessage({
            type: "ERROR",
            info: `Message of type ${message.type} shouldn't be sent to the sever`,
          }));
      }
    },
    close: (ws) => {
      const { authenticatedSocketIds } = ws.data.store;
      authenticatedSocketIds.delete(ws.id);
    }
  })
  .post("update", async (ctx) => {
    const { filepath, compressed } = ctx.body;
    const { tracker } = ctx.store;

    const contents = Bun.gunzipSync(compressed).toString();
    await tracker.pushUpdate(filepath, contents);

    ctx.set.status = 201;
  }, {
    body: t.Object({
      filepath: t.String(),
      compressed: t.String(),
    }),
  })
  .post("changes-since", async (ctx) => {
    const { tracker } = ctx.store;
    const updatedPaths = await tracker.getPathsUpdatedSince(ctx.body.time);

    return updatedPaths;
  }, {
    body: t.Object({
      time: t.Number(),
    }),
  })


export function startApp(directory: string) {
  app.store.tracker = getDirectoryTracker(directory);

  const port = app.store.config.port;

  app.listen(port, () => {
    console.log(`Started in ${directory} on ${port}`);
  });
}
