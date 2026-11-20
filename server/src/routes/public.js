import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Batch, Course, Student } from "../models/index.js";
import { notifyRegistration } from "../utils/notify.js";
import { asyncRoute, validate } from "../utils/validate.js";
const router = Router();
router.get(
  "/courses",
  asyncRoute(async (_req, res) =>
    res.json(
      await Course.find({ published: true }).sort({
        featured: -1,
        createdAt: 1,
      }),
    ),
  ),
);
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(200),
  phone: z.string().trim().min(7).max(25),
  education: z.string().trim().min(2).max(120),
  institution: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  motivation: z.string().trim().max(1000).optional().default(""),
  semester: z.string().trim().max(30).optional().default(""),
  program: z.string().trim().max(120).optional().default(""),
  batch: z.string().optional(),
  course: z.string(),
});
router.get(
  "/courses/:id/batches",
  asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ error: "Invalid course" });
    res.json(
      await Batch.find({ course: req.params.id, active: true })
        .select("name days startTime endTime capacity")
        .lean(),
    );
  }),
);
router.post(
  "/register",
  validate(schema),
  asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.body.course))
      return res.status(400).json({ error: "Invalid course" });
    const course = await Course.findOne({
      _id: req.body.course,
      published: true,
    });
    if (!course) return res.status(404).json({ error: "Course not available" });
    const count = await Student.countDocuments({
      course: course._id,
      status: { $ne: "rejected" },
    });
    if (count >= course.capacity)
      return res.status(409).json({ error: "This course is currently full" });
    if (req.body.batch) {
      if (
        !mongoose.isValidObjectId(req.body.batch) ||
        !(await Batch.exists({
          _id: req.body.batch,
          course: course._id,
          active: true,
        }))
      )
        return res.status(400).json({ error: "Invalid batch" });
    } else delete req.body.batch;
    if (req.body.batch) {
      const b = await Batch.findById(req.body.batch);
      if (
        (await Student.countDocuments({
          batch: b._id,
          status: { $ne: "rejected" },
          archivedAt: null,
        })) >= b.capacity
      )
        return res.status(409).json({ error: "Selected batch is full" });
    }
    try {
      const student = await Student.create(req.body);
      res
        .status(201)
        .json({
          id: student.id,
          message: "Registration received. Your application is pending review.",
        });
      void notifyRegistration(student, course);
    } catch (e) {
      if (e.code === 11000)
        return res
          .status(409)
          .json({ error: "This email is already registered for this course" });
      throw e;
    }
  }),
);
export default router;
