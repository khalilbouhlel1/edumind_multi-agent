import express from "express";
import mongoose from "mongoose";
import Session from "../models/Session.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(sessions);
  } catch (error) {
    console.error("List sessions error:", error);
    return res.status(500).json({ error: "Failed to load sessions" });
  }
});

router.patch("/:id/favorite", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid session id" });
  }

  try {
    const session = await Session.findOne({ _id: id, userId: req.user.id });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    session.isFavorite = !session.isFavorite;
    await session.save();
    return res.json(session.toObject());
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return res.status(500).json({ error: "Failed to update favorite" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid session id" });
  }

  try {
    const deleted = await Session.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ error: "Session not found" });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("Delete session error:", error);
    return res.status(500).json({ error: "Failed to delete session" });
  }
});

export default router;
