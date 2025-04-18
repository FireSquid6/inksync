import { z } from "zod";

// Base message schema with type discriminator
export const baseMessageSchema = z.object({
  type: z.enum(["AUTHENTICATE", "UPDATED", "PUSH_UPDATE", "FETCH_UPDATED_SINCE"]),
});

// Individual message schemas
export const authenticateSchema = baseMessageSchema.extend({
  type: z.literal("AUTHENTICATE"),
  token: z.string(),
});

export const updatedSchema = baseMessageSchema.extend({
  type: z.literal("UPDATED"),
  filepath: z.string(),
  content: z.string(),
  timestamp: z.number(), // Unix timestamp
});

export const pushUpdateSchema = baseMessageSchema.extend({
  type: z.literal("PUSH_UPDATE"),
  filepath: z.string(),
  content: z.string(), // Could be more specific like z.instanceof(Buffer) depending on requirements
});

export const fetchUpdatedSinceSchema = baseMessageSchema.extend({
  type: z.literal("FETCH_UPDATED_SINCE"),
  timestamp: z.number(), // Unix timestamp
});

// Discriminated union of all message types
export const messageSchema = z.discriminatedUnion("type", [
  authenticateSchema,
  updatedSchema,
  pushUpdateSchema,
  fetchUpdatedSinceSchema,
]);

// Type inference from the schema
export type Message = z.infer<typeof messageSchema>;
export type AuthenticateMessage = z.infer<typeof authenticateSchema>;
export type UpdatedMessage = z.infer<typeof updatedSchema>;
export type PushUpdateMessage = z.infer<typeof pushUpdateSchema>;
export type FetchUpdatedSinceMessage = z.infer<typeof fetchUpdatedSinceSchema>;

export function parseMessage(message: string): Message | Error {
  try {
    const data = JSON.parse(message);
    return messageSchema.parse(data);
  } catch (e) {
    return e as Error;
  }
}
