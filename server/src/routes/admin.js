import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { Attendance, Course, Session, Student } from "../models/index.js";
import { asyncRoute, validate } from "../utils/validate.js";
const r = Router();
r.use(requireAdmin);
const id = z.string().refine(mongoose.isValidObjectId, "Invalid ID");
const course = z.object({
  title: z.string().trim().min(3, "Title must contain at least 3 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens",
    ),
  description: z
    .string()
    .trim()
    .min(10, "Description must contain at least 10 characters"),
  category: z.string().trim().min(1).default("Computer Science"),
  duration: z.string().trim().min(1).default("8 weeks"),
  level: z.string().trim().min(1).default("Beginner"),
  fee: z.coerce.number().finite().min(0).default(0),
  capacity: z.coerce.number().int().min(1).default(40),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  modules: z.array(z.string().trim().min(1)).default([]),
  color: z.enum(["teal", "violet", "amber"]).default("teal"),
});
r.get(
  "/stats",
  asyncRoute(async (_req, res) => {
    const [courses, students, sessions, pending, byCourse] = await Promise.all([
      Course.countDocuments(),
      Student.countDocuments(),
      Session.countDocuments(),
      Student.countDocuments({ status: "pending" }),
      Student.aggregate([
        { $group: { _id: "$course", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "_id",
            as: "course",
          },
        },
        { $unwind: "$course" },
        { $project: { title: "$course.title", count: 1 } },
      ]),
    ]);
    res.json({ courses, students, sessions, pending, byCourse });
  }),
);
r.get(
  "/courses",
  asyncRoute(async (_req, res) =>
    res.json(await Course.find().sort({ createdAt: 1 })),
  ),
);
r.post(
  "/courses",
  validate(course),
  asyncRoute(async (req, res) => {
    if (await Course.exists({ slug: req.body.slug }))
      return res
        .status(409)
        .json({ error: "A course with this URL slug already exists" });
    const created = await Course.create(req.body);
    res.status(201).json(created);
  }),
);
r.put(
  "/courses/:id",
  validate(course),
  asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ error: "Invalid course ID" });
    if (
      await Course.exists({ slug: req.body.slug, _id: { $ne: req.params.id } })
    )
      return res
        .status(409)
        .json({ error: "Another course already uses this URL slug" });
    const doc = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!doc) return res.status(404).json({ error: "Course not found" });
    res.json(doc);
  }),
);
r.delete(
  "/courses/:id",
  asyncRoute(async (req, res) => {
    if (
      (await Student.exists({ course: req.params.id })) ||
      (await Session.exists({ course: req.params.id }))
    )
      return res
        .status(409)
        .json({
          error: "Course has students or sessions; unpublish it instead",
        });
    await Course.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  }),
);
r.get(
  "/students",
  asyncRoute(async (req, res) => {
    const filter = {};
    if (req.query.course && mongoose.isValidObjectId(req.query.course))
      filter.course = req.query.course;
    if (
      req.query.status &&
      ["pending", "approved", "rejected"].includes(req.query.status)
    )
      filter.status = req.query.status;
    res.json(
      await Student.find(filter)
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .limit(3000),
    );
  }),
);
r.patch(
  "/students/:id",
  validate(z.object({ status: z.enum(["pending", "approved", "rejected"]) })),
  asyncRoute(async (req, res) => {
    const s = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!s) return res.status(404).json({ error: "Not found" });
    res.json(s);
  }),
);
// Permanently delete one student application and all attendance records linked to it.
// All /admin routes require a valid admin session (see r.use(requireAdmin) above).
r.delete(
  "/students/:id",
  asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student application not found" });
    }
    // Remove attendance references first, so old records cannot reappear.
    await Attendance.deleteMany({ student: student._id });
    await Student.deleteOne({ _id: student._id });
    return res.json({ ok: true, deletedId: String(student._id) });
  }),
);
r.get(
  "/sessions",
  asyncRoute(async (req, res) => {
    const filter =
      req.query.course && mongoose.isValidObjectId(req.query.course)
        ? { course: req.query.course }
        : {};
    res.json(
      await Session.find(filter)
        .populate("course", "title")
        .sort({ date: -1, createdAt: -1 }),
    );
  }),
);
r.post(
  "/sessions",
  validate(
    z.object({
      course: id,
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      topic: z.string().min(2),
      startTime: z.string().optional().default(""),
      endTime: z.string().optional().default(""),
      notes: z.string().optional().default(""),
    }),
  ),
  asyncRoute(async (req, res) => {
    if (!(await Course.exists({ _id: req.body.course })))
      return res.status(404).json({ error: "Course not found" });
    res.status(201).json(await Session.create(req.body));
  }),
);
r.delete(
  "/sessions/:id",
  asyncRoute(async (req, res) => {
    await Attendance.deleteMany({ session: req.params.id });
    await Session.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  }),
);
r.get(
  "/sessions/:id/attendance",
  asyncRoute(async (req, res) => {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const [students, records] = await Promise.all([
      Student.find({ course: session.course, status: "approved" }).sort({
        name: 1,
      }),
      Attendance.find({ session: session.id }),
    ]);
    res.json({ session, students, records });
  }),
);
r.put(
  "/sessions/:id/attendance",
  validate(
    z.object({
      records: z
        .array(
          z.object({
            student: id,
            status: z.enum(["present", "absent", "late", "excused"]),
          }),
        )
        .max(2000),
    }),
  ),
  asyncRoute(async (req, res) => {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const allowed = await Student.find({
      course: session.course,
      status: "approved",
    }).distinct("_id");
    const set = new Set(allowed.map(String));
    if (req.body.records.some((a) => !set.has(a.student)))
      return res
        .status(400)
        .json({
          error: "Attendance contains a student not approved for this course",
        });
    if (
      new Set(req.body.records.map((a) => a.student)).size !==
      req.body.records.length
    )
      return res.status(400).json({ error: "Duplicate students" });
    await Attendance.bulkWrite(
      req.body.records.map((a) => ({
        updateOne: {
          filter: { session: session._id, student: a.student },
          update: { $set: { status: a.status } },
          upsert: true,
        },
      })),
    );
    res.json({ ok: true });
  }),
);
export default r;
