import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const makeToken = (user) => jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register",
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters."),
  body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email."),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
      const { name, email, password } = req.body;
      const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
      if (existing.rowCount) return res.status(409).json({ message: "An account with this email already exists." });
      const hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        "INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,role",
        [name, email, hash]
      );
      const user = result.rows[0];
      res.status(201).json({ token: makeToken(user), user });
    } catch (err) { next(err); }
  }
);

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return res.status(400).json({ message: "Please enter your email and password." });
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ token: makeToken(safeUser), user: safeUser });
  } catch (err) { next(err); }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

export default router;
