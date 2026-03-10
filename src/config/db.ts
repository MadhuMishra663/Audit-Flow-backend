import pkg from "pg";

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();

    console.log("✅ PostgreSQL connected");

    client.release();
  } catch (error) {
    console.error("❌ DB connection failed", error);
    process.exit(1);
  }
};
