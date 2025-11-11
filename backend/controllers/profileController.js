import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import crypto from "crypto";

// Helper to find user
const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.userId });
    if (!user) return errorResponse(res, 404, "User not found");
    return user;
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// Generic CRUD handler factory
const makeHandlers = (fieldName) => ({
  // GET all
  getAll: async (req, res) => {
    const user = await getUser(req, res);
    if (!user) return;
    return successResponse(res, 200, user[fieldName], `${fieldName} retrieved`);
  },

  // POST (create new)
  create: async (req, res) => {
    const user = await getUser(req, res);
    if (!user) return;

    const newItem = { id: crypto.randomUUID(), ...req.body };
    user[fieldName].push(newItem);
    await user.save();
    return successResponse(res, 201, newItem, `${fieldName} item created`);
  },

  // PUT (update by id)
  update: async (req, res) => {
    const { id } = req.params;
    const user = await getUser(req, res);
    if (!user) return;

    const index = user[fieldName].findIndex((item) => item.id === id);
    if (index === -1)
      return errorResponse(res, 404, `${fieldName} item not found`);

    user[fieldName][index] = { ...user[fieldName][index]._doc, ...req.body };
    await user.save();
    return successResponse(res, 200, user[fieldName][index], `${fieldName} item updated`);
  },

  // DELETE (remove by id)
  remove: async (req, res) => {
    const { id } = req.params;
    const user = await getUser(req, res);
    if (!user) return;

    const exists = user[fieldName].some((item) => item.id === id);
    if (!exists)
      return errorResponse(res, 404, `${fieldName} item not found`);

    user[fieldName] = user[fieldName].filter((item) => item.id !== id);
    await user.save();
    return successResponse(res, 200, null, `${fieldName} item deleted`);
  },
});

// Create handlers for all 6 sections
export const basicInfo = makeHandlers("basicInfo");
export const employment = makeHandlers("employmentHistory");
export const skills = makeHandlers("skills");
export const education = makeHandlers("education");
export const certifications = makeHandlers("certifications");
export const projects = makeHandlers("projects");

