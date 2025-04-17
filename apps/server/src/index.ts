import { z } from "zod";


export const treeNodeSchema = z.object({
  filepath: z.string(),
  blobPath: z.string(),
});

export type TreeNode = z.infer<typeof treeNodeSchema>;

export const treeSchema = z.object({
  index: z.number(),
  nodes: z.array(treeNodeSchema),
  newBlobs: z.array(z.string()),
});

export type Tree = z.infer<typeof treeSchema>;

