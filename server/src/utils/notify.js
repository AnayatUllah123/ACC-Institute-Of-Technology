// Optional transactional email via Resend. No secret keys sent to the client.
const clean = (s) =>
  String(s ?? "")
    .replace(/[<>]/g, "")
    .slice(0, 250);
export async function notifyRegistration(student, course) {
  if (
    !process.env.RESEND_API_KEY ||
    !process.env.EMAIL_FROM ||
    !process.env.NOTIFY_EMAIL
  )
    return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [process.env.NOTIFY_EMAIL],
        subject: "New ACC course registration",
        text: `Student: ${clean(student.name)}\nEmail: ${clean(student.email)}\nPhone: ${clean(student.phone)}\nCourse: ${clean(course.title)}\nSemester: ${clean(student.semester || "Not specified")}\nSubmitted: ${new Date(student.createdAt).toISOString()}`,
      }),
    });
    if (!res.ok) throw new Error("Email provider returned " + res.status);
    return true;
  } catch (err) {
    console.error("Registration notification failed:", err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function notifyConfirmation(student) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !student?.email)
    return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [student.email],
        subject: "ACC Institute — Registration confirmed",
        text: `Dear ${clean(student.name)},\n\nYour course registration has been confirmed. Please contact ACC Institute for further instructions.\n\nACC Institute of Technology`,
      }),
    });
    if (!res.ok) throw Error("Email provider returned " + res.status);
    return true;
  } catch (err) {
    console.error("Confirmation notification failed:", err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
