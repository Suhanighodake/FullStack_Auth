import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  await client.connect();
  console.log("Connected!");
  const result = await client.query("SELECT NOW()");
  console.log(result.rows);
  await client.end();
} catch (err) {
  console.error(err);
}