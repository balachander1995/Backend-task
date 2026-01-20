// import { type Config } from "drizzle-kit";

// import { env } from "@/env";

// export default {
//   schema: "./src/server/db/schema.ts",
//   dialect: "postgresql",
//   dbCredentials: {
//     url: env.DATABASE_URL,
//   },
//   tablesFilter: ["backendtask_*"],
// } satisfies Config;

import { defineConfig } from "drizzle-kit";
import { env } from "@/env";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
