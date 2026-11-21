import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import { Admin, Course } from "./models/index.js";
import admin from "./routes/admin.js";
import auth from "./routes/auth.js";
import management from "./routes/management.js";
import publicRoutes from "./routes/public.js";
for (const key of [
  "MONGODB_URI",
  "JWT_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
])
  if (!process.env[key]) {
    console.error(`Missing ${key} in server/.env`);
    process.exit(1);
  }
if (process.env.JWT_SECRET.length < 32)
  throw Error("JWT_SECRET must be at least 32 characters");
await mongoose.connect(process.env.MONGODB_URI);
const email = process.env.ADMIN_EMAIL.toLowerCase();
if (!(await Admin.exists({ email }))) {
  await Admin.create({
    email,
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
  });
  console.log("Initial admin account created");
}
const seeds = [
  {
    title: "Programming Fundamentals",
    slug: "programming-fundamentals",
    description:
      "Start your programming journey with problem solving, logic, variables, loops and functions.",
    duration: "8 weeks",
    level: "Beginner",
    modules: [
      "Programming basics",
      "Control flow",
      "Functions",
      "Problem solving",
    ],
    color: "teal",
    featured: true,
  },
  {
    title: "Object Oriented Programming",
    slug: "object-oriented-programming",
    description:
      "Master classes, objects, encapsulation, inheritance, polymorphism and practical application design.",
    duration: "10 weeks",
    level: "Intermediate",
    modules: [
      "Classes & objects",
      "Encapsulation",
      "Inheritance",
      "Polymorphism",
    ],
    color: "violet",
    featured: true,
  },
  {
    title: "Data Structures & Algorithms",
    slug: "data-structures-algorithms",
    description:
      "Build strong foundations in arrays, linked lists, trees, graphs, sorting and algorithmic thinking.",
    duration: "12 weeks",
    level: "Intermediate",
    modules: [
      "Complexity",
      "Linear structures",
      "Trees & graphs",
      "Searching & sorting",
    ],
    color: "amber",
    featured: true,
  },
];
for (const item of seeds)
  await Course.updateOne(
    { slug: item.slug },
    { $setOnInsert: item },
    { upsert: true },
  );
const app = express();
app.disable("x-powered-by");
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://acc-institute-of-technology.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "30kb" }));
app.use(cookieParser());
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60000,
    limit: 12,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
app.use(
  "/api/register",
  rateLimit({
    windowMs: 60 * 60000,
    limit: 8,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.get("origin");

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: "Cross-origin request blocked",
    });
  }

  next();
});

app.use("/api/auth", auth);
app.use("/api", publicRoutes);
app.use("/api/admin", admin);
app.use("/api/admin/manage", management);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 11000)
    return res
      .status(409)
      .json({ error: "A record with this value already exists" });
  if (err.name === "CastError")
    return res.status(400).json({ error: "Invalid record ID" });
  res.status(500).json({ error: "An unexpected server error occurred" });
});
const PORT = Number(process.env.PORT) || 4000;

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`ACC Institute API ready at http://127.0.0.1:${PORT}`);
});

server.on("error", (error) => {
  console.error("Server listening error:", error);
});
