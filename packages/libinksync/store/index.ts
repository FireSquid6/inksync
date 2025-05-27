import { z } from "zod";


export const updateSchema = z.object({
  filepath: z.string(),
  hash: z.string(),
  time: z.number(),
})
export type Update = z.infer<typeof updateSchema>;

export interface Store {
  updateRecord(filepath: string, hash: string, time: number): Promise<void>;
  getAllRecords(): Promise<Update[]>;
  updateRecordObject(update: Update): Promise<void>;
  getRecordsNewThan(timestamp: number): Promise<Update[]>;
  getRecord(filepath: string): Promise<Update | null>;
  setLastPull(t: number): Promise<void>;
  getLastPull(): Promise<number>;
}

