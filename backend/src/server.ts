import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";

import volunteerProfileAPI from "./api/volunteer-profile.js";
import adminVolunteerAPI from "./api/admin-volunteer.js";
import routeAPI from "./api/route.js";
import itemsAPI from "./api/items.js";

const app = Fastify({
  logger: true,
});

// register CORS
app.register(cors, {
  origin: true,
});

// register multipart before routes that use request.file()
app.register(multipart, {
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// health check
app.get("/health", async () => {
  return {
    status: "ok",
  };
});

// register API routes
app.register(volunteerProfileAPI);
app.register(adminVolunteerAPI);
app.register(routeAPI);
app.register(itemsAPI);

// start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;

    await app.listen({
      port,
      host: "0.0.0.0",
    });

    app.log.info(`Server listening on port ${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
