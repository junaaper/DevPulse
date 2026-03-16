import cors from "cors";

const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

export const corsMiddleware = cors({
  origin: allowedOrigin,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
});
