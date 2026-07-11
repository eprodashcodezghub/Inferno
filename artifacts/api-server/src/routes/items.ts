import { Router, type IRouter } from "express";
import { eq, isNull, sql, desc, ilike } from "drizzle-orm";
import { db, itemsTable } from "@workspace/db";
import {
  ListItemsQueryParams,
  ListRecentItemsQueryParams,
  GetItemParams,
  UpdateItemParams,
  UpdateItemBody,
  DeleteItemParams,
  GetItemPathParams,
  CreateItemBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

// List items in a folder (or root)
router.get("/items", async (req, res): Promise<void> => {
  // Normalize query params: treat string "null"/"undefined" as absent
  const rawQuery = { ...req.query };
  if (rawQuery.parentId === "null" || rawQuery.parentId === "undefined" || rawQuery.parentId === "") {
    delete rawQuery.parentId;
  }

  const query = ListItemsQueryParams.safeParse(rawQuery);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { parentId, search } = query.data;

  if (search) {
    const results = await db
      .select()
      .from(itemsTable)
      .where(ilike(itemsTable.name, `%${search}%`))
      .orderBy(itemsTable.type, itemsTable.name);
    res.json(results);
    return;
  }

  let items;
  if (parentId == null) {
    items = await db
      .select()
      .from(itemsTable)
      .where(isNull(itemsTable.parentId))
      .orderBy(itemsTable.type, itemsTable.name);
  } else {
    items = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.parentId, parentId))
      .orderBy(itemsTable.type, itemsTable.name);
  }

  res.json(items);
});

// Create a file or folder
router.post("/items", async (req, res): Promise<void> => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .insert(itemsTable)
    .values({
      name: parsed.data.name,
      type: parsed.data.type,
      parentId: parsed.data.parentId ?? null,
      objectPath: parsed.data.objectPath ?? null,
      mimeType: parsed.data.mimeType ?? null,
      size: parsed.data.size ?? null,
    })
    .returning();

  res.status(201).json(item);
});

// List recent files
router.get("/items/recent", async (req, res): Promise<void> => {
  const query = ListRecentItemsQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? query.data.limit : 20;

  const items = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.type, "file"))
    .orderBy(desc(itemsTable.createdAt))
    .limit(limit);

  res.json(items);
});

// Get single item
router.get("/items/:id", async (req, res): Promise<void> => {
  const params = GetItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.id, params.data.id));

  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.json(item);
});

// Update (rename/move) an item
router.patch("/items/:id", async (req, res): Promise<void> => {
  const params = UpdateItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if ("parentId" in parsed.data) updates.parentId = parsed.data.parentId;

  const [item] = await db
    .update(itemsTable)
    .set(updates)
    .where(eq(itemsTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.json(item);
});

// Delete an item (and its children recursively via DB cascade or manual)
router.delete("/items/:id", async (req, res): Promise<void> => {
  const params = DeleteItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Recursive delete: gather all descendant IDs using a CTE
  const result = await db.execute(sql`
    WITH RECURSIVE descendants AS (
      SELECT id FROM items WHERE id = ${params.data.id}
      UNION ALL
      SELECT i.id FROM items i
      INNER JOIN descendants d ON i.parent_id = d.id
    )
    DELETE FROM items WHERE id IN (SELECT id FROM descendants)
    RETURNING id
  `);

  if (!result.rows || result.rows.length === 0) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.sendStatus(204);
});

// Get full path (breadcrumb) for an item
router.get("/items/:id/path", async (req, res): Promise<void> => {
  const params = GetItemPathParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Walk up the tree
  const segments: Array<{ id: number | null; name: string; type: string }> = [];
  let currentId: number | null = params.data.id;

  while (currentId != null) {
    const [item] = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, currentId));

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    segments.unshift({ id: item.id, name: item.name, type: item.type });
    currentId = item.parentId;
  }

  // Prepend the root
  segments.unshift({ id: null, name: "inferno", type: "root" });

  res.json(segments);
});

export default router;
