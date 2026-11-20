// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json).
// The React app itself is served by Vercel as static files from dist/.
import app from "../server/app.js";

export default app;
