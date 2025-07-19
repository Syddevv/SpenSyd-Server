import IncomeModel from "../models/Incomes.js";
// Add Expense
export const addBalance = async (req, res) => {
  try {
    const { balance } = req.body;

    if (!balance) {
      return res
        .status(400)
        .json({ success: false, message: "Balance is Required" });
    }

    const newBalance = new IncomeModel({
      ...balance,
      userId: req.user.id,
    });

    await newBalance.save();

    return res.status(201).json({
      success: true,
      user: req.user,
      message: "Balance Submitted Successfully",
    });
  } catch (error) {
    console.log("Server error during submission of balance:", error.message);
  }
};
