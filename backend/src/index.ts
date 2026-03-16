import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { corsMiddleware } from "./middleware/cors";
import leaderboardRoutes from "./routes/leaderboard";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(corsMiddleware);
app.use(express.json());

app.use("/api/v1", leaderboardRoutes);

// Root redirect
app.get("/", (_req, res) => {
  res.json({
    name: "DevPulse API",
    version: "1.0.0",
    docs: "/api/v1/docs",
    health: "/api/v1/health",
  });
});

app.listen(PORT, () => {
  console.log(`DevPulse API running on http://localhost:${PORT}`);
  console.log(`GitHub token: ${process.env.GITHUB_TOKEN ? "configured" : "not set (60 req/hr limit)"}`);
});
