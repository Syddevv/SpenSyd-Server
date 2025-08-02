import ExpenseModel from "../models/Expenses.js";
// Add Expense
export const addExpense = async (req, res) => {
  try {
    const { expense } = req.body;

    // Validate request body
    if (!expense) {
      return res.status(400).json({
        success: false,
        message: "Expense data is required",
      });
    }

    // Validate required fields
    if (!expense.category || !expense.amount || !expense.date) {
      return res.status(400).json({
        success: false,
        message: "Category, amount, and date are required fields",
      });
    }

    // Validate amount is a positive number
    if (isNaN(expense.amount) || expense.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    // Rest of your controller code...
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
      message: "Expense submitted successfully",
    });
  } catch (error) {
    console.error("Error adding expense:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing expense",
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
