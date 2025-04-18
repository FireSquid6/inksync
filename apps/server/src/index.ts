import { z } from "zod";
import { Elysia } from "elysia";

export const trackedFileSchema = z.object({
  filepath: z.string(),
  lastUpdated: z.number(),
});


export type TrackedFile = z.infer<typeof trackedFileSchema>

export const trackerFileSchema = z.array(trackedFileSchema);

export type Trackerfile = z.infer<typeof trackerFileSchema>;



export const app = new Elysia()
  .ws("listen", () => {

  })
  .post("change", () => {

  })
  .get("current", () => {

  })
