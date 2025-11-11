import express from "express";
import { register, login, logout, forgotPassword, resetPassword, deleteAccount, checkProvider } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";
import passport from "passport";
import "../utils/passport.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.delete("/delete-account", verifyToken, deleteAccount);
router.post("/check-provider", checkProvider);

router.get( "/google", passport.authenticate("google", { scope: ["profile", "email"] }) );
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login-failed" }),
  (req, res) => {
    try {
      const { token, user } = req.user;

      // Redirect to frontend with the JWT as a URL param
      const redirectUrl = `http://localhost:8080/login?token=${token}`; // TEMPORARY!!! UPDATE TO REAL ONE ONCE LIVE AND MAKE FRONTEND ACCEPT TOKEN AS PARAM!

      return res.redirect(redirectUrl);
    } catch (err) {
      console.error("OAuth callback error:", err);
      return errorResponse(res, 500, "OAuth error");
    }
  }
);

export default router;

