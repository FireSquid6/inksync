import { z } from "zod";
import { Elysia, t } from "elysia";
import { failingTracker, getDirectoryTracker } from "./track";
import { defaultConfig } from "./config";

export const trackedFileSchema = z.object({
  filepath: z.string(),
  lastUpdated: z.number(),
});


export type TrackedFile = z.infer<typeof trackedFileSchema>

export const trackerFileSchema = z.array(trackedFileSchema);

export type Trackerfile = z.infer<typeof trackerFileSchema>;



export const app = new Elysia()
  .state("tracker", failingTracker())
  .state("config", defaultConfig())
  .ws("listen", () => {

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
