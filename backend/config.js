// Backend configuration
// IMPORTANT: Create a .env file in production with these values

export const MONGO_URI = process.env.MONGO_URI || "your-mongodb-uri-here";
export const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-here";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "your-google-client-id";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "your-google-client-secret";

// OpenAI API Key for AI features (Sprint 2)
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
