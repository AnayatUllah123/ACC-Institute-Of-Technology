
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Admin } from '../src/models/index.js';

async function resetAdmin() {
  try {
    const {
      MONGODB_URI,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error('Missing environment variables');
    }

    await mongoose.connect(MONGODB_URI);

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await Admin.findOneAndUpdate(
      { email },
      { $set: { passwordHash } },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('Admin credentials updated:', admin.email);
  } catch (error) {
    console.error('Reset failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

resetAdmin();
