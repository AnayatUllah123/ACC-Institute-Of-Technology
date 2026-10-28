import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { requireAdmin } from "../middleware/auth.js";
import { Admin } from "../models/index.js";
import { asyncRoute, validate } from "../utils/validate.js";

const router = Router();

// ========================================
// ADMIN LOGIN
// ========================================

router.post(
  "/login",
  validate(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  ),
  asyncRoute(async (req, res) => {
    const email = req.body.email.trim().toLowerCase();

    // Find admin from MongoDB
    const admin = await Admin.findOne({ email });

    // Compare password with stored bcrypt hash
    const passwordMatches = admin
      ? await bcrypt.compare(req.body.password, admin.passwordHash)
      : false;

    // Temporary diagnostic - remove after fixing login
    if (process.env.NODE_ENV !== "production") {
      console.log("\n========== ACC LOGIN DIAGNOSTIC ==========");
      console.log("Database:", Admin.db.name);
      console.log("Admin found:", Boolean(admin));
      console.log("Password matches:", passwordMatches);
      console.log("==========================================\n");
    }

    // Reject invalid credentials
    if (!admin || !passwordMatches) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Generate JWT after successful authentication
    const token = jwt.sign(
      {
        sub: admin.id,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      },
    );

    // Set secure HTTP-only cookie
    res.cookie("acc_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.json({
      email: admin.email,
    });
  }),
);

// ========================================
// ADMIN LOGOUT
// ========================================

router.post("/logout", (_req, res) => {
  res.clearCookie("acc_admin", {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.json({
    ok: true,
  });
});

// ========================================
// GET CURRENT ADMIN
// ========================================

router.get(
  "/me",
  requireAdmin,
  asyncRoute(async (req, res) => {
    const admin = await Admin.findById(req.adminId).select("email");

    return res.json(admin);
  }),
);

export default router;
