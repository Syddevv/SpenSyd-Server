import ExpenseModel from "../models/Expenses.js";
// Add Expense
export const addExpense = async (req, res) => {
  try {
    const { expense } = req.body;

    if (!expense) {
      return res
        .status(400)
        .json({ success: false, message: "Expense is Required" });
    }

    const newExpense = new ExpenseModel({
      ...expense,
      userId: req.user.id,
    });

    await newExpense.save();

    return res.status(201).json({
      success: true,
      user: req.user,
      message: "Expense Submitted Successfully",
    });
  } catch (error) {
    console.log("Server error during submission of expense:", error.message);
  }
};
