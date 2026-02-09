import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}

const sqlite = new Database(path.join(dataDir, 'sqlite.db'));
export const db = drizzle(sqlite, { schema });
