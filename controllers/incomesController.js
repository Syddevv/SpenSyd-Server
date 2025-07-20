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

export const fetchBalance = async (req, res) => {
  try {
    const balances = await IncomeModel.find({ userId: req.user.id });
    return res.status(200).json({ success: true, balances });
  } catch (error) {
    console.log("Server error during fetching balances:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error during fetching balances",
      });
  }
};
