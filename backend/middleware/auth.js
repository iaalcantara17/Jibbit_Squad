import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/responseHandler.js";
import { JWT_SECRET } from "../config.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return errorResponse(res, 401, "No token provided");

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return errorResponse(res, 401, "Invalid or expired token");
  }
};

