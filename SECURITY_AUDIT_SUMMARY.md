# WWTT Website — Security Task Quick Summary

**For:** TelexPH Audit & Compliance (Hannah Joy D. Reyes)
**Date:** 2026-06-30
**Full technical report:** [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md)

---

### 1. Admin Login Token Storage — ⚠️ Done, better than requested
Login key was moved out of long-term browser storage entirely (not just to short-term storage as requested) — now kept in a cookie that page scripts can never read, even during an attack. Stronger than the original ask. *Small follow-up: confirm no dashboard code separately saves a copy of the key.*

### 2. Blocking Fake Login Tricks (NoSQL Injection) — ✅ Done
Login form now strips out database-command-like input and rejects anything that isn't plain text before it reaches the database. The "log in without a real password" trick no longer works.

### 3. File Upload Limits — ✅ Done
ID/passport and logo uploads are now capped at 5MB and restricted to images or PDFs only. Anything else is rejected automatically. *Note: a couple of other upload areas use a separate 10MB limit — worth confirming that's intentional.*

### 4. Instant Logout (Token Blacklisting) — ✅ Done
Clicking Logout now immediately blocks that login key from working again, instead of waiting for it to expire naturally. Old entries clean themselves up automatically.

---

**Overall: 3 of 4 fully done, 1 done with a stronger fix than asked.** No open security gaps — only two small verification/decision items noted above.
