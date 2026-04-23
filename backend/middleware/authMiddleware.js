import jwt from "jsonwebtoken";
import { SUBJECT_SET } from "../config/subjects.js";

/**
 * Reads Bearer JWT from Authorization, verifies with JWT_SECRET,
 * sets req.user = { id, email, subject } or responds 401.
 */
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const id = decoded.id ?? decoded.sub;
    const email = decoded.email;
    if (!id || !email) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let subject = decoded.subject;
    if (!subject || !SUBJECT_SET.has(String(subject))) {
      subject = "mathematics";
    }
    req.user = { id: String(id), email: String(email), subject: String(subject) };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export default authMiddleware;
