import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function summary(rows) {
  if (!rows.length) return { count: 0, highest: null, lowest: null, average: null, readings: [] };
  const values = rows.map(r => Number(r.value));
  return {
    count: values.length,
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Math.round((values.reduce((a,b)=>a+b,0) / values.length) * 10) / 10,
    readings: rows
  };
}

router.get("/", async (req, res, next) => {
  try {
    const selected = req.query.date;
    if (!selected || !/^\d{4}-\d{2}-\d{2}$/.test(selected)) return res.status(400).json({ message: "Please select a valid report date." });
    const monthStart = `${selected.slice(0,7)}-01`;
    const previousMonthStart = new Date(Date.UTC(Number(selected.slice(0,4)), Number(selected.slice(5,7))-2, 1)).toISOString().slice(0,10);
    const previousMonthEnd = new Date(Date.UTC(Number(selected.slice(0,4)), Number(selected.slice(5,7))-1, 0)).toISOString().slice(0,10);
    const [daily, mtd, monthly] = await Promise.all([
      pool.query("SELECT id,reading_date AS date,slot,value FROM readings WHERE user_id=$1 AND reading_date=$2 ORDER BY slot", [req.user.id, selected]),
      pool.query("SELECT id,reading_date AS date,slot,value FROM readings WHERE user_id=$1 AND reading_date BETWEEN $2 AND $3 ORDER BY reading_date,slot", [req.user.id, monthStart, selected]),
      pool.query("SELECT id,reading_date AS date,slot,value FROM readings WHERE user_id=$1 AND reading_date BETWEEN $2 AND $3 ORDER BY reading_date,slot", [req.user.id, previousMonthStart, previousMonthEnd])
    ]);
    res.json({ daily: summary(daily.rows), monthToDate: summary(mtd.rows), previousMonth: summary(monthly.rows), ranges: { daily: selected, monthToDate: `${monthStart} to ${selected}`, previousMonth: `${previousMonthStart} to ${previousMonthEnd}` } });
  } catch (err) { next(err); }
});

export default router;
