import express from "express";
import cors from "cors";
import routes from "./routes";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/* ✅ ENV CONFIG */
const CLIENT_URLS = process.env.CLIENT_URLS;

if (!CLIENT_URLS) {
  throw new Error("❌ CLIENT_URLS is not defined in .env");
}

/* ✅ CORS CONFIG */
const allowedOrigins: string[] = process.env.CLIENT_URLSS
  ? process.env.CLIENT_URLSS.split(",")
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

export default app;
