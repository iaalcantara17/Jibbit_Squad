import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { sendEmail } from "../utils/email.js";
import { JWT_SECRET } from "../config.js";

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return errorResponse(res, 400, "Missing required fields", ["name","email","password"]);

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return errorResponse(res, 400, "Email already registered", ["email"]);

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    return successResponse(res, 201, { id: user.user_id, email: user.email }, "User registered");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 401, "Invalid credentials", ["email"]);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return errorResponse(res, 401, "Invalid credentials", ["password"]);

    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "1h" });
    return successResponse(res, 200, { token }, "Login successful");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  // For stateless JWT, logout is client-side (delete token)
  return successResponse(res, 200, null, "Logged out successfully");
};


// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 404, "User not found");

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    const resetLink = `http://localhost:8080/forgot-password/${token}`; // LINK TO FRONTEND

    console.log("Sending password reset to:", email);
    console.log("Reset link:", resetLink);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
        <div style="max-width: 500px; margin: auto; background: white; border-radius: 8px; padding: 25px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="font-size: 15px; color: #555;">
            Hello <strong>${user.name}</strong>,<br><br>
            We received a request to reset your password for your <strong>Jibbit</strong> account. 
            Click the button below to reset it. This link will expire in <strong>15 minutes</strong>.
          </p>

          <a href="${resetLink}" 
             style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; 
                    padding: 10px 18px; border-radius: 6px; margin-top: 15px;">
             Reset Password
          </a>

          <p style="font-size: 13px; color: #888; margin-top: 25px;">
            If you didn’t request this, you can safely ignore this email.<br>
            The link will automatically expire.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
          <p style="font-size: 12px; color: #aaa;">© ${new Date().getFullYear()} Jibbit. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: "Reset Your Jibbit Password",
        text: `Hello ${user.name},\n\nClick the link below to reset your Jibbit password:\n${resetLink}\n\nThis link expires in 15 minutes.`,
        html: htmlContent,
      });
    } catch (err) {
      console.error("sendEmail failed:", err);
      return errorResponse(res, 500, "Failed to send email");
    }

    return successResponse(res, 200, null, "Reset email sent");
  } catch (err) {
    console.error("forgotPassword failed:", err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password)
      return errorResponse(res, 400, "Missing new password", ["password"]);

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // not expired
    });

    if (!user) return errorResponse(res, 400, "Invalid or expired token");

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`Password reset successful for ${user.email}`);
    return successResponse(res, 200, null, "Password reset successful");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// DELETE /api/auth/delete-account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password)
      return errorResponse(res, 400, "Password is required", ["password"]);

    // Find the user via JWT payload
    const user = await User.findOne({ user_id: req.user.userId });
    if (!user)
      return errorResponse(res, 404, "User not found");

    // Confirm password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return errorResponse(res, 401, "Incorrect password");

    const email = user.email;
    const name = user.name;

    // Delete user and all data
    await User.deleteOne({ user_id: req.user.userId });

    // Send confirmation email (non-blocking)
    try {
      await sendEmail({
        to: email,
        subject: "Your Jibbit Account Has Been Deleted",
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: white; border-radius: 8px; padding: 25px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">Account Deletion Confirmation</h2>
              <p style="font-size: 15px; color: #555;">
                Hello <strong>${name}</strong>,<br><br>
                Your <strong>Jibbit</strong> account and all associated data have been permanently deleted.
              </p>
              <p style="font-size: 14px; color: #666;">
                If you did not request this deletion, please contact our support team immediately.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
              <p style="font-size: 12px; color: #aaa;">© ${new Date().getFullYear()} Jibbit. All rights reserved.</p>
            </div>
          </div>
        `
      });
    } catch (emailErr) {
      console.error("Failed to send deletion email:", emailErr);
      // Continue — deletion already done
    }

    // Let frontend handle logout (token invalidation client-side)
    return successResponse(res, 200, null, "Account deleted successfully");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/auth/check-provider
export const checkProvider = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return errorResponse(res, 400, "Email is required");

    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 404, "User not found");

    return successResponse(
      res,
      200,
      { provider: user.provider },
      "Provider retrieved successfully"
    );
  } catch (err) {
    console.error("checkProvider failed:", err);
    return errorResponse(res, 500, "Server error");
  }
};

