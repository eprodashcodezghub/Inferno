import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import http from 'http';

type Item = {
  id: number;
  name: string;
  type: 'file' | 'folder';
  parent_id: number | null;
  object_path: string | null;
  mime_type: string | null;
  size: number | null;
  created_at: string;
  updated_at: string;
};

function toApiItem(row: Item) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    parentId: row.parent_id,
    objectPath: row.object_path,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function startServer(userDataPath: string, port: number): Promise<void> {
  const dbPath = path.join(userDataPath, 'inferno.db');
  const filesDir = path.join(userDataPath, 'files');
  fs.mkdirSync(filesDir, { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id INTEGER,
      object_path TEXT,
      mime_type TEXT,
      size INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const storage = multer.diskStorage({
    destination: filesDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
  const upload = multer({ storage });

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/files', express.static(filesDir));

  // GET /api/items
  app.get('/api/items', (req, res) => {
    let parentIdParam = req.query.parentId as string | undefined;
    if (!parentIdParam || parentIdParam === 'null' || parentIdParam === 'undefined') parentIdParam = undefined;
    const search = req.query.search as string | undefined;

    let rows: Item[];
    if (search) {
      rows = sqlite.prepare(`SELECT * FROM items WHERE name LIKE ? ORDER BY type, name`).all(`%${search}%`) as Item[];
    } else if (parentIdParam == null) {
      rows = sqlite.prepare(`SELECT * FROM items WHERE parent_id IS NULL ORDER BY type, name`).all() as Item[];
    } else {
      rows = sqlite.prepare(`SELECT * FROM items WHERE parent_id = ? ORDER BY type, name`).all(parseInt(parentIdParam, 10)) as Item[];
    }
    res.json(rows.map(toApiItem));
  });

  // POST /api/items
  app.post('/api/items', (req, res) => {
    const { name, type, parentId, objectPath, mimeType, size } = req.body;
    const result = sqlite.prepare(
      `INSERT INTO items (name, type, parent_id, object_path, mime_type, size) VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
    ).get(name, type, parentId ?? null, objectPath ?? null, mimeType ?? null, size ?? null) as Item;
    res.status(201).json(toApiItem(result));
  });

  // GET /api/items/recent (must come before /:id)
  app.get('/api/items/recent', (req, res) => {
    const limit = parseInt(req.query.limit as string || '20', 10);
    const rows = sqlite.prepare(`SELECT * FROM items WHERE type='file' ORDER BY created_at DESC LIMIT ?`).all(limit) as Item[];
    res.json(rows.map(toApiItem));
  });

  // GET /api/items/:id/path (must come before /:id)
  app.get('/api/items/:id/path', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const segments: Array<{ id: number | null; name: string; type: string }> = [];
    let currentId: number | null = id;

    while (currentId != null) {
      const row = sqlite.prepare(`SELECT * FROM items WHERE id = ?`).get(currentId) as Item | undefined;
      if (!row) { res.status(404).json({ error: 'Not found' }); return; }
      segments.unshift({ id: row.id, name: row.name, type: row.type });
      currentId = row.parent_id;
    }
    segments.unshift({ id: null, name: 'inferno', type: 'root' });
    res.json(segments);
  });

  // GET /api/items/:id
  app.get('/api/items/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const row = sqlite.prepare(`SELECT * FROM items WHERE id = ?`).get(id) as Item | undefined;
    if (!row) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(toApiItem(row));
  });

  // PATCH /api/items/:id
  app.patch('/api/items/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { name, parentId } = req.body;
    const current = sqlite.prepare(`SELECT * FROM items WHERE id = ?`).get(id) as Item | undefined;
    if (!current) { res.status(404).json({ error: 'Not found' }); return; }
    const newName = name ?? current.name;
    const newParentId = 'parentId' in req.body ? (parentId ?? null) : current.parent_id;
    const updated = sqlite.prepare(
      `UPDATE items SET name = ?, parent_id = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`
    ).get(newName, newParentId, id) as Item;
    res.json(toApiItem(updated));
  });

  // DELETE /api/items/:id
  app.delete('/api/items/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const exists = sqlite.prepare(`SELECT id FROM items WHERE id = ?`).get(id);
    if (!exists) { res.status(404).json({ error: 'Not found' }); return; }

    // Recursively collect descendant IDs and delete files
    const collectAndDelete = (pid: number) => {
      const children = sqlite.prepare(`SELECT id, object_path, type FROM items WHERE parent_id = ?`).all(pid) as Pick<Item, 'id' | 'object_path' | 'type'>[];
      children.forEach(c => collectAndDelete(c.id));
      const row = sqlite.prepare(`SELECT object_path, type FROM items WHERE id = ?`).get(pid) as Pick<Item, 'object_path' | 'type'> | undefined;
      if (row?.type === 'file' && row.object_path) {
        const filename = path.basename(row.object_path);
        const filePath = path.join(filesDir, filename);
        try { fs.unlinkSync(filePath); } catch { /* already gone */ }
      }
      sqlite.prepare(`DELETE FROM items WHERE id = ?`).run(pid);
    };
    collectAndDelete(id);
    res.sendStatus(204);
  });

  // GET /api/storage/stats
  app.get('/api/storage/stats', (_req, res) => {
    const totalFiles = (sqlite.prepare(`SELECT COUNT(*) as c FROM items WHERE type='file'`).get() as { c: number }).c;
    const totalFolders = (sqlite.prepare(`SELECT COUNT(*) as c FROM items WHERE type='folder'`).get() as { c: number }).c;
    const totalBytes = (sqlite.prepare(`SELECT COALESCE(SUM(size), 0) as s FROM items WHERE type='file'`).get() as { s: number }).s;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    const recentUploads = (sqlite.prepare(`SELECT COUNT(*) as c FROM items WHERE type='file' AND created_at > ?`).get(oneWeekAgo) as { c: number }).c;
    res.json({ totalFiles, totalFolders, totalBytes, recentUploads });
  });

  // POST /api/storage/upload — direct multipart upload
  app.post('/api/storage/upload', upload.single('file'), (req, res) => {
    if (!req.file) { res.status(400).json({ error: 'No file provided' }); return; }
    res.json({
      objectPath: `/api/files/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype || 'application/octet-stream',
    });
  });

  return new Promise((resolve) => {
    http.createServer(app).listen(port, '127.0.0.1', () => resolve());
  });
}
