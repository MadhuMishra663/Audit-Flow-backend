import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import { createPolicyTables } from "./db/policy/setup";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
  await connectDB();

    // Setup policy management tables
    // await createPolicyTables();

  app.listen(PORT, () =>
    console.log(` AuditFlow backend running on port ${PORT}`),
  );
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

