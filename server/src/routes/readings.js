import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validateReading } from "../utils/validation.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let sql = "SELECT id, reading_date AS date, slot, value FROM readings WHERE user_id=$1";
    const params = [req.user.id];
    if (from) { params.push(from); sql += ` AND reading_date >= $${params.length}`; }
    if (to) { params.push(to); sql += ` AND reading_date <= $${params.length}`; }
    sql += " ORDER BY reading_date DESC, CASE slot WHEN 'morning_fasting' THEN 1 WHEN 'after_breakfast' THEN 2 WHEN 'after_lunch' THEN 3 ELSE 4 END";
    const result = await pool.query(sql, params);
    res.json({ readings: result.rows });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const error = validateReading(req.body);
    if (error) return res.status(400).json({ message: error });
    const { date, slot, value } = req.body;
    const count = await pool.query("SELECT COUNT(*)::int AS count FROM readings WHERE user_id=$1 AND reading_date=$2", [req.user.id, date]);
    if (count.rows[0].count >= 4) return res.status(400).json({ message: "You can add only 4 readings per day." });
    const result = await pool.query(
      "INSERT INTO readings(user_id,reading_date,slot,value) VALUES($1,$2,$3,$4) RETURNING id,reading_date AS date,slot,value",
      [req.user.id, date, slot, Number(value)]
    );
    res.status(201).json({ reading: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "You already have a reading for this time slot on this date." });
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const error = validateReading(req.body);
    if (error) return res.status(400).json({ message: error });
    const { date, slot, value } = req.body;
    const existing = await pool.query("SELECT id FROM readings WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    if (!existing.rowCount) return res.status(404).json({ message: "Reading not found." });
    const count = await pool.query("SELECT COUNT(*)::int AS count FROM readings WHERE user_id=$1 AND reading_date=$2 AND id<>$3", [req.user.id, date, req.params.id]);
    if (count.rows[0].count >= 4) return res.status(400).json({ message: "You can add only 4 readings per day." });
    const result = await pool.query(
      "UPDATE readings SET reading_date=$1,slot=$2,value=$3,updated_at=NOW() WHERE id=$4 AND user_id=$5 RETURNING id,reading_date AS date,slot,value",
      [date, slot, Number(value), req.params.id, req.user.id]
    );
    res.json({ reading: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "You already have a reading for this time slot on this date." });
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await pool.query("DELETE FROM readings WHERE id=$1 AND user_id=$2 RETURNING id", [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Reading not found." });
    res.json({ message: "Reading deleted successfully." });
  } catch (err) { next(err); }
});

export default router;
