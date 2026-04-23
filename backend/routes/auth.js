import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { SUBJECT_SET } from "../config/subjects.js";

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const signToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const subject = user.subject || "mathematics";
  const payload = { id: user._id.toString(), email: user.email, subject };
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

const formatUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  subject: user.subject || "mathematics",
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, subject } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!subject || !SUBJECT_SET.has(String(subject))) {
      return res.status(400).json({ error: "A valid field of study is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      subject: String(subject),
    });
    const token = signToken(user);

    return res.status(201).json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    if (error.message === "JWT_SECRET is not configured") {
      console.error(error);
      return res.status(500).json({ error: "Server misconfiguration" });
    }
    console.error("Register error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(String(password), user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    if (error.message === "JWT_SECRET is not configured") {
      console.error(error);
      return res.status(500).json({ error: "Server misconfiguration" });
    }
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

export default router;
