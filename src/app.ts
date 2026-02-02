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

const allowedOrigins = CLIENT_URLS.split(",");

/* ✅ CORS MUST COME FIRST */
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Incoming origin:", origin);

      if (!origin) return callback(null, true); // Postman / server calls
      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(null, false);
    },
    credentials: true,
  }),
);

/* ✅ THEN body parsers */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ✅ THEN routes */
app.use("/api", routes);

export default app;
