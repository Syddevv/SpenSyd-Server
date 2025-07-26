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

    const month = new Date().getMonth();
    const newExpense = new ExpenseModel({
      ...expense,
      userId: req.user.id,
      createdAt: new Date(expense.date),
      month,
    });

    await newExpense.save();

    return res.status(201).json({
      success: true,
      user: req.user,
      message: "Expense Submitted Successfully",
    });
  } catch (error) {
    console.log("Server error during submission of expense:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during submission of expense",
    });
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
