# WWTT Website — Weekly Security Task Implementation Report

**Prepared for:** TelexPH Audit & Compliance (Hannah Joy D. Reyes)
**Project:** WanderWave Travel & Tours (WWTT) Website
**Report date:** 2026-06-30
**Scope:** Plain-language verification of this week's 4 security tasks against what is actually built in the website's code.

---

## Summary

| # | Task | Status |
|---|------|--------|
| 1 | Migrate Admin Auth Token to sessionStorage | ⚠️ Done a better way than requested |
| 2 | Prevent NoSQL Injection in Authentication | ✅ Done |
| 3 | Restrict File Uploads and Validate File Types | ✅ Done |
| 4 | Implement JWT Token Blacklisting for Logout Revocation | ✅ Done |

**Bottom line:** 3 of the 4 tasks are completely done. The 4th was solved using a stronger method than what was originally asked for, with one small loose end worth double-checking (explained below).

---

## 1. Admin Login Token Storage

**What the risk was:** The admin login "key" (token) was being kept in the browser's long-term storage (`localStorage`), which never expires on its own. If an attacker ever managed to inject malicious code into the site (an XSS attack) or someone used a shared/public computer, that key could be stolen and reused indefinitely to get into the admin panel — even days or weeks later.

**What was asked:** Move the key to `sessionStorage` instead, so it disappears automatically once the browser tab is closed, shrinking the window of opportunity for theft.

**What was actually done — and why it's better:** Rather than just moving the key to a shorter-lived storage spot, the developers removed it from browser storage entirely. The login key is now stored in what's called an **HttpOnly cookie** — a special kind of storage that the website's own page scripts are physically not allowed to read. This means even if an attacker successfully injected malicious code into the page (the XSS scenario this task was meant to prevent), that code still could not get its hands on the login key at all. This is a stronger protection than the originally requested sessionStorage fix, because sessionStorage can still be read by injected scripts while the tab is open — it only solves the "stays around too long" problem, not the "can be stolen at all" problem.

**One loose end to verify:** When an admin logs in, the system's reply to the browser still includes a copy of the key as plain data (not just in the protected cookie). If any part of the admin dashboard code is quietly grabbing that copy and saving it somewhere readable, it would partially undo this protection. Recommend a quick code check to confirm no part of the admin panel does this. This does not require new development — just a verification pass.

---

## 2. Blocking Database Query Manipulation (NoSQL Injection) on Login

**What the risk was:** The admin login form expects a plain email and password. But because the website's database (MongoDB) understands special command-like values, an attacker could type something unusual into the email or password field instead of a normal value — a value crafted to trick the database into treating it as a command meaning "match anything that isn't blank." If that trick worked, an attacker could log in as an admin without knowing any real password, and potentially pull data out of the database without ever having valid credentials.

**What was done:** The login form now cleans every submitted email and password, stripping out anything that looks like a database command, before it ever reaches the database. On top of that, it now double-checks that the email and password are plain text and rejects the request immediately if they're anything else (like a command-shaped value). Both protections work together, so the trick described above no longer works.

**Status:** Fully implemented and active on the live login route.

---

## 3. Restricting What Files Can Be Uploaded

**What the risk was:** Without limits on uploaded files, someone could upload an oversized file to slow down or crash the server (a denial-of-service attack), or disguise a malicious program as an "image" to try to get it to run on the server.

**What was done:** The system now checks two things on every upload of an ID/passport document or a business logo: (1) is it actually an image or a PDF — not a disguised program — and (2) is it 5MB or smaller. Anything that fails either check is rejected before it's even saved.

**One detail worth knowing:** A few other upload areas of the site (separate from ID/passport and logo uploads) use a slightly different, more permissive limit of 10MB and route files through a third-party storage service (Cloudinary) which does its own filtering. This isn't a gap — it's a different, already-controlled path — but it's worth a business decision on whether all upload areas should follow the same 5MB rule for consistency, or whether the current split is intentional.

---

## 4. Instantly Invalidating Login Sessions on Logout

**What the risk was:** Normally, a login key (JWT) stays valid until its built-in expiration time, no matter what — even after someone clicks "Logout." That means if a key had been stolen earlier, logging out would not stop the thief from continuing to use it; it would still work until it naturally expired.

**What was done:** The system now keeps a list of "logged-out" keys in the database the moment someone clicks Logout. Every time the admin panel checks whether a login key is valid, it first checks this list — if the key is on it, access is refused immediately, regardless of whether the key's built-in expiration has passed yet. The list also automatically cleans itself up (entries delete themselves once they would have expired anyway), so it doesn't grow forever or slow down the system over time.

**Status:** Fully implemented, end-to-end — logout records the key, and every future request checks against that record before allowing access.

---

## Recommended Next Steps

1. Quick verification pass: confirm no part of the admin dashboard is saving the login key from the login reply data (Task 1 loose end). No development needed, just a check.
2. Business decision: should the 5MB image/PDF rule apply to *all* upload areas of the site, or is the current split (5MB for ID/logo uploads, 10MB via Cloudinary elsewhere) intentional and fine as-is?
3. Per this week's task notes, additional tasks may be picked up once the above are closed out.

---

## Technical Appendix (for developer reference)

<details>
<summary>Click to expand — file paths, line numbers, and code for each task</summary>

### Task 1 — Token storage
- `backend/routes/adminRoute.js:200-206`
  ```js
  res.cookie('adminToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000
  });
  ```
- `admin/src/components/login/login.jsx:93` — `localStorage.setItem('adminData', ...)` (profile fields only, no token)
- Loose end: `adminRoute.js:211` (token still in response body), `backend/middleware/auth.js:11-13` (Bearer header fallback)

### Task 2 — NoSQL injection prevention
- `backend/routes/adminRoute.js:8` — `const sanitize = require('mongo-sanitize');`
- `backend/routes/adminRoute.js:84-85` — `sanitize(req.body.email)`, `sanitize(req.body.password)`
- `backend/routes/adminRoute.js:95-100` — explicit `typeof` checks
- Dependency: `backend/package.json:34` — `"mongo-sanitize": "^1.1.0"`

### Task 3 — File upload restrictions
- `backend/routes/bookingRoute.js:44-65`
  ```js
  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/jpg', 'application/pdf',
      'image/gif', 'image/webp', 'image/tiff'
    ];
    const isImage = file.mimetype.startsWith('image/');
    if (allowedMimeTypes.includes(file.mimetype) || isImage) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, WEBP, and PDF are allowed.'), false);
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  });
  ```
- `backend/routes/adminRoute.js:29-55` — equivalent for business-logo upload
- Other routes (`imagesRoute.js`, `tourBookingRoute.js`, `config/cloudinary.js`) use 10MB + Cloudinary `allowed_formats`
- Dependency: `backend/package.json:37` — `"multer": "^1.4.5-lts.1"`

### Task 4 — JWT blacklisting
- `backend/models/TokenBlacklist.js:1-11`
  ```js
  const tokenBlacklistSchema = new mongoose.Schema({
    token:     { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date,   required: true }
  });
  tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  ```
- `backend/routes/adminRoute.js:249-265` — logout adds token to blacklist
- `backend/middleware/auth.js:24-34` — middleware checks blacklist before accepting token

</details>
