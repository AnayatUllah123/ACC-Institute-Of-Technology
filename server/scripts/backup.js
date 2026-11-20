// Run on a trusted backend host, e.g. daily via cron. Do not commit backup files.
import "dotenv/config";
import mongoose from "mongoose";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  Attendance,
  AuditLog,
  Batch,
  Course,
  Payment,
  Session,
  Student,
  StudentNote,
} from "../src/models/index.js";
if (!process.env.MONGODB_URI) throw Error("MONGODB_URI must be configured");
const folder = resolve(process.env.BACKUP_DIR || "./private-backups");
await mongoose.connect(process.env.MONGODB_URI);
try {
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const models = {
    courses: Course,
    students: Student,
    payments: Payment,
    notes: StudentNote,
    batches: Batch,
    sessions: Session,
    attendance: Attendance,
    audit: AuditLog,
  };
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    collections: {},
  };
  for (const [name, model] of Object.entries(models))
    backup.collections[name] = await model.find().lean();
  const filename = "acc-" + new Date().toISOString().slice(0, 10) + ".json";
  await writeFile(resolve(folder, filename), JSON.stringify(backup), {
    encoding: "utf8",
    mode: 0o600,
  });
  console.log("Backup created:", filename);
} finally {
  await mongoose.disconnect();
}
