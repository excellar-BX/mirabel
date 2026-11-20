// One-off: copy photos from server/uploads/ (old disk storage) into MongoDB.
// Usage: npm run migrate:photos
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB, disconnectDB } from "../db.js";
import Person from "../models/Person.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../uploads");
const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

await connectDB();
const people = await Person.collection
  .find({ photo: { $type: "string" }, hasPhoto: { $ne: true } })
  .toArray();

let migrated = 0;
for (const p of people) {
  const file = path.join(uploadsDir, path.basename(p.photo));
  try {
    const data = await fs.readFile(file);
    const type = TYPES[path.extname(file).toLowerCase()] || "image/jpeg";
    await Person.collection.updateOne(
      { _id: p._id },
      { $set: { photoData: data, photoType: type, hasPhoto: true }, $unset: { photo: "" } }
    );
    migrated++;
    console.log(`ok   ${p.name} (${p.photo})`);
  } catch (err) {
    console.warn(`skip ${p.name}: ${p.photo} (${err.code || err.message})`);
  }
}

console.log(`Migrated ${migrated}/${people.length} photos.`);
await disconnectDB();
