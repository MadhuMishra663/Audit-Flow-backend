import express from "express";
import cors from "cors";
import routes from "./routes";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

/* ✅ ENV CONFIG */
const CLIENT_URLS = process.env.CLIENT_URLS;

if (!CLIENT_URLS) {
  throw new Error("❌ CLIENT_URLS is not defined in .env");
}

const allowedOrigins = process.env.CLIENT_URLS?.split(",") || [];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("REQUEST ORIGIN:", origin);
      console.log("ALLOWED:", allowedOrigins);
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

/* ✅ THEN body parsers */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
/* ✅ THEN routes */
app.use("/api", routes);

export default app;
