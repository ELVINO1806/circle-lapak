// Mint Safety Verdict — local/Fly entrypoint: imports the Express app from
// app.mjs and listens on PORT. Vercel uses api/index.mjs instead.
import app from "./app.mjs";

const port = Number(process.env.PORT ?? 8402);
app.listen(port, () => {
  console.log(`mint-safety-verdict listening on :${port}`);
});
