import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB connected");
    console.log("Mongo Host:", mongoose.connection.host);
    console.log("Mongo DB:", mongoose.connection.name);
  } catch (error) {
    console.error("❌ DB connection failed", error);
    process.exit(1);
  }
};
