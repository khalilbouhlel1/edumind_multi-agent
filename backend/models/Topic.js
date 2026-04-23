import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
  keywords: [String],
});

export default mongoose.model("Topic", TopicSchema);
