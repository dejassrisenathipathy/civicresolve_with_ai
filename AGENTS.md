Project: CivicResolve — AI-powered civic grievance reporting and resolution.
Stack: Next.js (App Router, TypeScript strict), Tailwind CSS, Firebase Auth, Cloud Firestore, Gemini via @google/genai, Zod, Vitest. Deployed to Vercel.

Rules:
1. GEMINI_API_KEY is read only in server code. Never prefix it with NEXT_PUBLIC_. Never commit .env files; keep .env.example updated.
2. Server uses firebase-admin with cert() using environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Admin credentials come only from env vars, never from a service-account JSON file in the repo.
3. All Firestore writes go through server route handlers using the Admin SDK. Clients may only read what firestore.rules allows.
4. Every route handler validates input with Zod and verifies the Firebase ID token (Authorization: Bearer). Admin routes also require custom claim admin === true.
5. Personal data (phone, email, ID numbers) is redacted before any text is sent to Gemini.
6. Accessibility: semantic HTML, labels on every input, visible focus, aria-live for async results, status never shown by colour alone, WCAG AA contrast.
7. Code quality: small modules, no 'any', JSDoc on lib functions, errors returned as { error: { code, message } } with correct HTTP status.
8. Every lib/ module with logic gets a Vitest test.
9. Keep the repo lean: no generated files, no large images.
10. Before finishing any task, run npm run lint, npm run build and npm test and fix failures.
