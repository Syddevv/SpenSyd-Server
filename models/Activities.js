import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, required: true }, // 'expense' or 'income'
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const ActivityModel = mongoose.model("Activity", activitySchema);
export default ActivityModel;
