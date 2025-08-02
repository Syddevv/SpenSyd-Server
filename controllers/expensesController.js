import ExpenseModel from "../models/Expenses.js";
import ActivityModel from "../models/Activities.js";
// Add Expense
export const addExpense = async (req, res) => {
  try {
    const { expense } = req.body;

    // Validate fields (amount, date, etc.)
    if (!expense || !expense.category || !expense.amount || !expense.date) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    // Save expense
    const newExpense = new ExpenseModel({
      ...expense,
      userId: req.user.id,
      createdAt: new Date(expense.date),
    });

    const savedExpense = await newExpense.save();

    // ✅ Create activity record (server-side)
    const newActivity = new ActivityModel({
      userId: req.user.id,
      type: "expense",
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      referenceId: savedExpense._id,
    });

    await newActivity.save();

    return res.status(201).json({
      success: true,
      data: savedExpense,
    });
  } catch (error) {
    console.error("Error in addExpense:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fetch Expense
export const fetchExpense = async (req, res) => {
  try {
    const expenses = await ExpenseModel.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, expenses });
  } catch (error) {
    console.log("Server error during fetching expenses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during fetching of expense",
    });
  }
};
