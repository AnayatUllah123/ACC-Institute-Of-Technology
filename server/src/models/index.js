import mongoose from "mongoose";
const { Schema, model } = mongoose;
const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: "Computer Science" },
    description: { type: String, required: true },
    duration: { type: String, default: "8 weeks" },
    level: { type: String, default: "Beginner" },
    fee: { type: Number, default: 0, min: 0 },
    capacity: { type: Number, default: 40, min: 1 },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    modules: [String],
    color: { type: String, default: "teal" },
  },
  { timestamps: true },
);
export const Course = model("Course", courseSchema);
const studentSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    education: { type: String, required: true },
    institution: String,
    city: String,
    motivation: String,
    semester: { type: String, default: "" },
    program: { type: String, default: "" },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", default: null },
    registrationStatus: {
      type: String,
      enum: ["unconfirmed", "confirmed", "cancelled"],
      default: "unconfirmed",
    },
    confirmedAt: Date,
    archivedAt: Date,
    feeOverride: { type: Number, min: 0, default: null },
    feeDueDate: { type: String, default: "" },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);
studentSchema.index({ email: 1, course: 1 }, { unique: true });
export const Student = model("Student", studentSchema);
export const Session = model(
  "Session",
  new Schema(
    {
      course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
      date: { type: String, required: true },
      topic: { type: String, required: true },
      startTime: String,
      endTime: String,
      notes: String,
    },
    { timestamps: true },
  ),
);
const attendanceSchema = new Schema(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
  },
  { timestamps: true },
);
attendanceSchema.index({ session: 1, student: 1 }, { unique: true });
export const Attendance = model("Attendance", attendanceSchema);
export const Admin = model(
  "Admin",
  new Schema(
    {
      email: { type: String, unique: true, lowercase: true },
      passwordHash: { type: String, required: true },
    },
    { timestamps: true },
  ),
);

// Additional operational models; existing collections and records remain intact.
export const Batch = model(
  "Batch",
  new Schema(
    {
      course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
      name: { type: String, required: true, trim: true },
      days: [String],
      startTime: String,
      endTime: String,
      startDate: String,
      endDate: String,
      capacity: { type: Number, default: 40, min: 1 },
      active: { type: Boolean, default: true },
    },
    { timestamps: true },
  ),
);
export const Payment = model(
  "Payment",
  new Schema(
    {
      student: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        index: true,
      },
      amount: { type: Number, required: true, min: 0.01 },
      method: {
        type: String,
        enum: ["cash", "bank", "easypaisa", "jazzcash", "other"],
        default: "cash",
      },
      receivedAt: { type: Date, default: Date.now },
      reference: { type: String, default: "" },
      remarks: { type: String, default: "" },
      recordedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
      voidedAt: Date,
      voidReason: String,
    },
    { timestamps: true },
  ),
);
export const StudentNote = model(
  "StudentNote",
  new Schema(
    {
      student: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        index: true,
      },
      text: { type: String, required: true, maxlength: 2000 },
      admin: { type: Schema.Types.ObjectId, ref: "Admin" },
    },
    { timestamps: true },
  ),
);
export const AuditLog = model(
  "AuditLog",
  new Schema(
    {
      admin: { type: Schema.Types.ObjectId, ref: "Admin" },
      event: { type: String, required: true },
      entity: { type: String, required: true },
      entityId: String,
      details: Schema.Types.Mixed,
    },
    { timestamps: true },
  ),
);
