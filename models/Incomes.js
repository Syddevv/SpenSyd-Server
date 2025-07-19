import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const IncomeModel = mongoose.model("Income", incomeSchema);
export default IncomeModel;
