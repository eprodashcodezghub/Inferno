import { Router, type IRouter } from "express";
import { eq, count, sum, and, gte } from "drizzle-orm";
import { db, itemsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/storage/stats", async (req, res): Promise<void> => {
  const [filesResult] = await db
    .select({ count: count() })
    .from(itemsTable)
    .where(eq(itemsTable.type, "file"));

  const [foldersResult] = await db
    .select({ count: count() })
    .from(itemsTable)
    .where(eq(itemsTable.type, "folder"));

  const [bytesResult] = await db
    .select({ total: sum(itemsTable.size) })
    .from(itemsTable)
    .where(eq(itemsTable.type, "file"));

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [recentResult] = await db
    .select({ count: count() })
    .from(itemsTable)
    .where(
      and(
        eq(itemsTable.type, "file"),
        gte(itemsTable.createdAt, oneWeekAgo)
      )
    );

  res.json({
    totalFiles: filesResult?.count ?? 0,
    totalFolders: foldersResult?.count ?? 0,
    totalBytes: Number(bytesResult?.total ?? 0),
    recentUploads: recentResult?.count ?? 0,
  });
});

export default router;
