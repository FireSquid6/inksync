import { z } from "zod";
import { Elysia, t } from "elysia";
import { failingTracker, getDirectoryTracker } from "./track";
import { defaultConfig } from "./config";
import { tokenIsValid } from "./auth";

export const trackedFileSchema = z.object({
  filepath: z.string(),
  last_updated: z.number(),
});


export type TrackedFile = z.infer<typeof trackedFileSchema>

export const trackerFileSchema = z.array(trackedFileSchema);

export type Trackerfile = z.infer<typeof trackerFileSchema>;



const CHANNEL_NAME = "MESSAGES";

// TODO when back:
// - write a client that can join the websocket
// - define message types
export const app = new Elysia()
  .state("tracker", failingTracker())
  .state("config", defaultConfig())
  .ws("listen", {
    body: t.Object({
      message: t.String(),
    }),
    headers: t.Object({
      token: t.Optional(t.String()),
    }),
    message: (ws, { message }) => {
      console.log(`Got ${message} from websocket`);
      ws.publish(CHANNEL_NAME, message)
    },
    open: (ws) => {
      const { token } = ws.data.headers;

      if (!token) {
        console.log ("No token in headers. Closing");
        ws.close();
        return;
      }

      if (!tokenIsValid(token)) {
        console.log(`Token ${token} is not valid`);
        ws.close();
        return;
      }

      ws.subscribe(CHANNEL_NAME);
    },
    close: (ws) => {
      if (ws.isSubscribed(CHANNEL_NAME)) {
        ws.unsubscribe(CHANNEL_NAME);
      }
    },
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
