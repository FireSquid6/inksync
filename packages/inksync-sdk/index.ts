import { z } from "zod";

export const updateSchema = z.object({
  filepath: z.string(),
  content: z.string(),
  lastUpdate: z.number(),
});

export type Update = z.infer<typeof updateSchema>;

// Base message schema with type discriminator
export const baseMessageSchema = z.object({
  type: z.enum(["AUTHENTICATE", "UPDATE_SUCCESSFUL", "OUTDATED", "AUTHENTICATED", "UPDATED", "PUSH_UPDATES", "FETCH_UPDATED_SINCE", "ERROR"]),
});

// Individual message schemas
export const authenticateSchema = baseMessageSchema.extend({
  type: z.literal("AUTHENTICATE"),
  token: z.string(),
});

export const updateSuccessfulSchema = baseMessageSchema.extend({
  type: z.literal("UPDATE_SUCCESSFUL"),
})

export const authenticatedSchema = baseMessageSchema.extend({
  type: z.literal("AUTHENTICATED"),
})

export const updatedSchema = baseMessageSchema.extend({
  type: z.literal("UPDATED"),
  updates: z.array(updateSchema),
});

export const pushUpdatesSchema = baseMessageSchema.extend({
  type: z.literal("PUSH_UPDATES"),
  updates: z.array(updateSchema),
});

export const outdatedSchema = baseMessageSchema.extend({
  type: z.literal("OUTDATED"),
  filepath: z.string(),
})

export const fetchUpdatedSinceSchema = baseMessageSchema.extend({
  type: z.literal("FETCH_UPDATED_SINCE"),
  timestamp: z.number(),
});

export const errorSchema = baseMessageSchema.extend({
  type: z.literal("ERROR"),
  info: z.string(),
});

// Discriminated union of all message types
export const messageSchema = z.discriminatedUnion("type", [
  authenticateSchema,
  authenticatedSchema,
  updatedSchema,
  pushUpdatesSchema,
  fetchUpdatedSinceSchema,
  errorSchema,
  outdatedSchema,
  updateSuccessfulSchema,
]);

// Type inference from the schema
export type Message = z.infer<typeof messageSchema>;

export function parseMessage(message: string): Message | Error {
  try {
    const data = JSON.parse(message);
    return messageSchema.parse(data);
  } catch (e) {
    return e as Error;
  }
}

// helper function for type safety
export function makeMessage(message: Message): string {
  return JSON.stringify(message);
}
