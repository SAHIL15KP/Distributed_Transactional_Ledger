require("./loadEnv");

const express = require("express");
const cors = require("cors");
const rootRouter = require("./routes/index");
const { connectToDatabase } = require("./db");

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  }
}));

app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok"
  });
});

app.use(async (_req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    res.status(500).json({
      message: "Database connection failed"
    });
  }
});

app.use("/api/v1", rootRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: error.message || "Internal server error"
  });
});

module.exports = app;
