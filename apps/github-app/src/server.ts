import { run } from "probot";
import app from "./index";

run(app).catch((err: Error) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
