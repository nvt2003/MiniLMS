import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HF_TOKEN);

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const BATCH_SIZE = 100;

while (true) {
  const [rows] = await db.query(`
    SELECT id, title, description
    FROM courses
    WHERE embedding IS NULL
    LIMIT ?
`, [100]);

if (rows.length === 0) {
    break;
}

for (const row of rows) {
    try {
        const text = `${row.title}\n${row.description}`;

        const embedding = await hf.featureExtraction({
            model: "BAAI/bge-m3",
            inputs: text,
        });

        await db.query(
            `
            UPDATE courses
            SET embedding = ?
            WHERE id = ?
            `,
            [
                JSON.stringify(embedding),
                row.id
            ]
        );

        console.log(`Updated ${row.id}`);

    } catch (err) {
        console.error(`Failed ${row.id}`, err);
    }
}
}
await db.end();