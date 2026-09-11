import "dotenv/config";
import Fastify from "fastify";
import { supabase } from "./supabase.js";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  const { error } = await supabase
    .from("items")
    .select("id")
    .limit(1);

  if (error) {
    return {
      status: "error",
      supabase: false,
    };
  }

  return {
    status: "ok",
    supabase: true,
  };
});

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0",
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();