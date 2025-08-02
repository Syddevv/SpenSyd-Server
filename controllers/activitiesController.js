import ActivityModel from "../models/Activities.js";

export const addActivity = async (req, res) => {
  try {
    const { activity } = req.body;
    const newActivity = new ActivityModel({
      ...activity,
      userId: req.user.id,
    });

    await newActivity.save();
    return res.status(201).json({
      success: true,
      activity: newActivity,
    });
  } catch (error) {
    console.error("Error adding activity:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add activity",
    });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const activities = await ActivityModel.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(3);
    return res.status(200).json({ success: true, activities });
  } catch (error) {
    console.log("Error fetching activities:", error.message);
    return res.status(500).json({ success: false });
  }
};
