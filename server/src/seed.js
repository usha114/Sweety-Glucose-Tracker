import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { pool, initializeDatabase } from "./db.js";
dotenv.config();

await initializeDatabase();
const email = "demo@sweety.test";
const password = "DemoPass123!";
const hash = await bcrypt.hash(password, 12);
const userResult = await pool.query(
  `INSERT INTO users(name,email,password_hash) VALUES('Demo Patient',$1,$2)
   ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
  [email, hash]
);
const userId = userResult.rows[0].id;
const today = new Date();
const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
const samples = [
  ["morning_fasting", 105], ["after_breakfast", 142],
  ["after_lunch", 136], ["after_dinner", 128]
];
for (const [slot, value] of samples) {
  await pool.query(
    `INSERT INTO readings(user_id,reading_date,slot,value) VALUES($1,$2,$3,$4)
     ON CONFLICT(user_id,reading_date,slot) DO UPDATE SET value=EXCLUDED.value`,
    [userId, date, slot, value]
  );
}
console.log("Demo account ready:", email, "/", password);
await pool.end();
