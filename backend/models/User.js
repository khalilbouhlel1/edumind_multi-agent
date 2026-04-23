import mongoose from "mongoose";
import { SUBJECT_IDS } from "../config/subjects.js";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    enum: SUBJECT_IDS,
    required: true,
    default: "mathematics",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", userSchema);
