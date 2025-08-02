import IncomeModel from "../models/Incomes.js";
import ActivityModel from "../models/Activities.js";

// Add Expense
export const addBalance = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { balance } = req.body;

    // Validate request exists
    if (!balance) {
      return res.status(400).json({
        success: false,
        message: "Balance data is required",
      });
    }

    // Validate required fields
    const requiredFields = ["category", "amount", "date"];
    const missingFields = requiredFields.filter((field) => !balance[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate amount
    const amount = Number(balance.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    // Validate date
    const date = new Date(balance.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Create and save balance
    const newBalance = new IncomeModel({
      category: balance.category,
      amount: amount,
      date: date,
      userId: req.user.id,
      createdAt: date,
      month: date.getMonth(),
      description: balance.description || null,
    });

    const savedBalance = await newBalance.save();

    // Create activity
    const newActivity = new ActivityModel({
      userId: req.user.id,
      type: "income",
      category: balance.category,
      amount: amount,
      date: date,
      referenceId: savedBalance._id,
      createdAt: new Date(),
    });

    await newActivity.save();

    return res.status(201).json({
      success: true,
      data: {
        balance: savedBalance,
        message: "Balance and activity recorded successfully",
      },
    });
  } catch (error) {
    console.error("Error in addBalance:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate balance entry detected",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(", ")}`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const fetchBalance = async (req, res) => {
  try {
    const balances = await IncomeModel.find({ userId: req.user.id })
      .select("category amount date createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, balances });
  } catch (error) {
    console.log("Server error during fetching balances:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during fetching balances",
    });
  }
};
