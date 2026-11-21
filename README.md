# CivicResolve

**AI-powered citizen grievance reporting and resolution, built with Google Gemini and Firebase.**

🔗 **Live app:** https://YOUR-APP.vercel.app  
🏁 Built for **PromptWars × GDG On-Campus PSG iTech** using **Google Antigravity** and **Gemini**.

---

## The problem

Potholes, overflowing garbage bins, broken streetlights and water leaks affect everyone, yet reporting them is hard. Citizens don't know which department to contact or how to describe the problem, and they rarely hear back. Authorities receive unstructured complaints that someone has to read, sort and prioritise by hand.

## The solution

CivicResolve lets anyone report a civic issue in under a minute, with no account needed. **Google Gemini** reads the complaint (and photo, if attached) and automatically:

1. **Classifies** the issue into one of 10 civic categories
2. **Detects priority** (Critical / High / Medium / Low, plus a 1–100 urgency score) using a public-safety rubric
3. **Recommends the department** responsible, with a one-line reason
4. **Flags safety risks** such as open manholes or exposed live wires

Every complaint gets a tracking code (e.g. `CR-NQDAGL`) and a status timeline: **Reported → In Progress → Resolved**.

## Features

| Feature | What it does |
| --- | --- |
| Citizen reporting | Title, description, category ("Let AI decide" by default), address, optional GPS location, optional photo |
| AI classification | Gemini analyses the text and photo and returns schema-checked JSON |
| Priority detection | Critical / High / Medium / Low + 1–100 score + safety-risk flag |
| Department recommendation | Routes to one of 10 municipal departments |
| Tracking | Every complaint gets a `CR-XXXXXX` code and a status timeline |
| Public tracking | Look up any complaint by code at `/track`, with no personal data shown |
| Re-run AI | Owners can re-run the AI analysis on a complaint |
| Admin access | Admin login (email/password) verified by a Firebase custom claim |
| Resilience | If Gemini is slow or unavailable, a rule-based classifier takes over, so a complaint is never left unclassified |

## How the AI works

```
Citizen text ──► PII redaction ──► Gemini (structured JSON output) ──► Zod validation ──► Firestore
                  (phone, email,        + photo (EXIF stripped)          │
                   ID numbers)                                           └─ on failure ─► rule-based fallback
```

- **Prompt-injection safe:** the complaint is wrapped in `<complaint>` tags and the system instruction tells Gemini to treat it as data only. The fallback classifier never reacts to words like "critical" typed by the user.
- **Structured output:** Gemini must return a fixed JSON schema (category and priority are enums), which is then validated with Zod before it is saved.
- **Priority rubric given to Gemini:**
  - **Critical:** immediate danger to life or health (exposed live wire, open manhole, burst water main, sewage in drinking water)
  - **High:** safety risk or affects many people (large pothole on a main road, streetlight out on a busy road, garbage near a school or hospital)
  - **Medium:** localised inconvenience
  - **Low:** cosmetic or minor

### Categories → departments

| Category | Department |
| --- | --- |
| Roads & Potholes | Roads & Public Works |
| Garbage & Sanitation | Solid Waste Management |
| Streetlights & Electrical | Electrical & Street Lighting |
| Water Supply & Leakage | Water Supply Board |
| Drainage & Sewage | Drainage & Sewerage |
| Traffic Signals | Traffic Engineering |
| Parks & Public Spaces | Parks & Horticulture |
| Stray Animals | Public Health & Veterinary |
| Public Safety | Public Safety Cell |
| Other | General Grievance Cell |

## Architecture

```mermaid
flowchart TB
  C[Citizen browser<br/>photo compressed + EXIF stripped] -- HTTPS + Firebase ID token --> API
  A[Admin browser] -- HTTPS + admin claim --> API
  subgraph SERVER[Next.js server · Vercel]
    API[API routes<br/>token check · Zod validation · rate limit] --> P[Privacy layer<br/>PII redaction]
    P --> AI[AI service<br/>Gemini + rule-based fallback]
  end
  API --> AUTH[Firebase Auth<br/>anonymous + email/password]
  API -- Admin SDK writes --> FS[(Cloud Firestore<br/>complaints · complaintImages)]
  AI -- redacted text + clean photo --> GEM[Google Gemini API]
```

**What happens when a complaint is submitted**

1. The browser compresses the photo on a canvas (max 1024 px, JPEG), which also removes GPS/EXIF metadata.
2. `POST /api/complaints` verifies the Firebase ID token, validates every field with Zod and applies a rate limit (5 reports per user per 10 minutes).
3. The complaint is saved to Firestore with status **Reported**; the photo is stored separately in `complaintImages`.
4. Phone numbers, emails and ID numbers are redacted from the text.
5. Gemini returns the category, priority, score, department and reasoning, which are validated and saved.
6. The citizen sees the result on the complaint page with the tracking code and timeline.

## Google technologies used

| Technology | Used for |
| --- | --- |
| **Google Gemini API** (`@google/genai`) | Multimodal classification, priority detection, department routing |
| **Firebase Authentication** | Anonymous sign-in for citizens, email/password + custom claims for admins |
| **Cloud Firestore** | Complaints, AI results, status history, photos |
| **Google Antigravity** | AI-first IDE used to build the whole project from prompts |

## Privacy & security

| Risk | How CivicResolve handles it |
| --- | --- |
| Personal data sent to AI | Phone numbers, emails and Aadhaar/PAN-like IDs are redacted before any Gemini call |
| Photo location leaks | Photos are re-encoded in the browser, which strips EXIF/GPS metadata |
| Public exposure | Public tracking shows no reporter identity, description or photo |
| Photos accessible to anyone | Photos live in a separate collection and are served only to the owner or an admin through an authenticated route |
| Leaked API keys | Gemini key and Firebase admin credentials are server-side environment variables only, never in the repo or the browser |
| Unauthorised writes | All database writes go through the server with the Firebase Admin SDK; clients cannot write directly |
| Fake admins | Admin role is a Firebase custom claim, verified on the server for every admin request |
| Prompt injection | Complaint text is delimited as untrusted data; AI output is schema- and enum-validated |
| Spam | Per-user rate limiting and strict input length/type checks |
| Logging | Server logs contain only IDs, category, priority and latency, never complaint text |

## Accessibility

- Semantic HTML with landmarks and a skip-to-content link
- Every form field has a visible label and inline error messages
- `aria-live` announcements for submission status and AI results
- Priority and status shown with text and icons, not colour alone
- Keyboard-navigable, visible focus states, WCAG AA contrast, mobile-first layout

## Tech stack

Next.js 14 (App Router, TypeScript strict) · Tailwind CSS · Firebase Auth · Cloud Firestore · `@google/genai` · Zod · Vitest · Vercel

## Project structure

```
app/                  pages and API routes
  report/             citizen report form
  complaints/[id]/    complaint detail, AI result, timeline
  track/              public lookup by tracking code
  admin/login/        admin sign-in
  api/complaints/     create, read, re-classify, image endpoints
components/           reusable accessible UI components
lib/ai/               Gemini classifier + rule-based fallback
lib/privacy/          PII redaction
lib/security/         rate limiting
lib/firebase/         client config + Admin SDK setup
lib/domain/           types, Zod schemas, categories, departments, tracking codes
tests/                Vitest unit tests
AGENTS.md             rules given to the Antigravity agent
```

## Run it locally

**Requirements:** Node.js 20+, a Firebase project with Firestore and Authentication (Anonymous + Email/Password) enabled, and a Gemini API key from Google AI Studio.

```bash
git clone https://github.com/dejassrisenathipathy/civicresolve_with_ai.git
cd civicresolve_with_ai
npm install
```

Create a `.env.local` file (never commit it):

```
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=your-gemini-flash-model-id
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Then:

```bash
npm run dev      # http://localhost:3000
npm test         # run unit tests
npm run build    # production build
```

## Deployment

Deployed on **Vercel**: the GitHub repo is imported into Vercel, the five environment variables above are added in the project settings, and every push to `main` redeploys automatically. The Vercel domain is added to Firebase Authentication's authorised domains.

## Tests

Unit tests with **Vitest** cover:

- PII redaction (phone numbers, emails, ID numbers)
- Rule-based fallback classifier, including a prompt-injection case
- Gemini response parsing and validation
- Category → department mapping
- Tracking code format
- Input validation schemas
- Rate limiting

```bash
npm test
```

## Built with Google Antigravity

The entire app was built by prompting the Antigravity agent:

1. **Project rules** (`AGENTS.md`): stack, security rules, accessibility and testing standards
2. **Scaffold**: Next.js + TypeScript + Tailwind + Firebase setup
3. **Free-tier architecture + reporting flow**: Firestore data model, report form, photo compression, secure API
4. **Gemini classification**: PII redaction, structured output, priority rubric, fallback, tests
5. **Debugging**: diagnostic script for the Gemini connection and department validation fixes

## Limitations & next steps

- Full admin dashboard (filters, bulk status updates, department analytics)
- Duplicate detection for reports of the same issue nearby
- Map view of open complaints
- Notifications to citizens when status changes
- Tamil-language interface

## Author

**Dejas Sri S**, PSG Institute of Technology and Applied Research

## License

MIT
