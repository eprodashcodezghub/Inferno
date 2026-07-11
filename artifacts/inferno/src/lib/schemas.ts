import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100),
});

export const renameItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});
