import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// GET /api/users/me
export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.userId });
    if (!user) return errorResponse(res, 404, "User not found");
    return successResponse(res, 200, user, "Profile retrieved");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// PUT /api/users/me
export const updateProfile = async (req, res) => {
  try {
    const updateData = req.body;
    const updated = await User.findOneAndUpdate(
      { user_id: req.user.userId },
      { $set: updateData },
      { new: true }
    );
    if (!updated) return errorResponse(res, 404, "User not found");
    return successResponse(res, 200, updated, "Profile updated");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

