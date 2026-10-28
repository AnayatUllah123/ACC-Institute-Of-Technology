import bcrypt from "bcryptjs";
import "dotenv/config";
import mongoose from "mongoose";
import { Admin } from "../src/models/index.js";

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();

    const admin = await Admin.findOne({ email });

    const passwordMatches = admin
      ? await bcrypt.compare(process.env.ADMIN_PASSWORD, admin.passwordHash)
      : false;

    console.log("\n=== ACC ADMIN DIAGNOSTIC ===");
    console.log("Database:", mongoose.connection.name);
    console.log("Collection:", Admin.collection.name);
    console.log("Configured email:", email);
    console.log("Admin found:", Boolean(admin));
    console.log("Password matches ENV:", passwordMatches);
    console.log("============================\n");
  } catch (error) {
    console.error("Diagnostic failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();
