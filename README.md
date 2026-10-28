# ACC Institute — Full-stack Course Enrollment & Administration

A responsive React + Tailwind frontend, Node/Express API and MongoDB Atlas database.

## Features
- Premium responsive homepage and three seeded computing courses
- Public course registration forms, stored in MongoDB (not emailed)
- Admin login with httpOnly signed JWT cookie, hashed password, rate limiting
- Admin overview, course create/edit/publish/delete, enrollment counts
- Student applications, approve/reject, course filtering, CSV export
- Course class sessions and date-wise attendance (present/absent/late/excused)
- Responsive mobile/tablet/desktop UI, animated cards

## Setup
Requirements: Node.js 20+, npm, a MongoDB Atlas free M0 cluster.

1. In MongoDB Atlas, create an M0 cluster, database user and allowlist your server IP under Network Access. Copy the connection URI.
2. Copy `server/.env.example` to `server/.env`, fill in MONGODB_URI, JWT_SECRET (32+ random characters), ADMIN_EMAIL and ADMIN_PASSWORD. Never commit this file.
3. From project root run:
   ```bash
   npm install
   npm run install:all
   npm run dev
   ```
4. Open `http://localhost:5173`. API runs on port 4000. Admin at `/admin`.
5. The server seeds the three requested courses if they don't already exist. It creates the admin account only on the first run when the email doesn't exist. Later edits to ADMIN_PASSWORD do NOT reset an existing admin password.

## Production deployment
- Deploy `client` to Vercel or Netlify, build `npm run build`, output `dist`. Add an SPA fallback rewrite to `/index.html` for client-side routes.
- Deploy `server` to a persistent Node host (e.g. Render/Railway) with all environment variables and `NODE_ENV=production`. Configure `CLIENT_ORIGIN=https://your-frontend-domain`.
- Set `VITE_API_URL=https://your-api-domain` in the frontend build environment. Frontend and API should ideally use same-site subdomains to allow the `SameSite=Lax` auth cookie. If using cross-site domains, adjust cookie settings and CSRF protections appropriately before production.
- Allowlist the backend host's outbound IP in Atlas; avoid unrestricted IP access if possible.
- HTTPS is required in production for secure cookies. Add backups and monitoring.

## Security and operational notes
- This is a functional starter platform, not a security-audited enterprise SIS. Do a production security review before processing real student data.
- Public registration enforces unique email per course, basic validation and rate limiting. For high traffic add CAPTCHA and transactional capacity checks.
- Admin endpoints require authentication. CSRF protection should be added before cross-site cookie configurations or sensitive public deployment. Consider 2FA, audit logs, granular roles, password reset, retention/deletion policy and encryption-at-rest governance.
- No real student data or MongoDB credentials are included.
- Certificates are informational copy only; certificate issuance and verification are NOT implemented.
- Course fees are display data only; no payment collection is implemented.
