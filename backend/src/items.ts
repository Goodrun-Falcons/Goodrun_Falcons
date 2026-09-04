import "dotenv/config";
import Fastify from "fastify";
import { createClient } from "@supabase/supabase-js";

const app = Fastify({ logger: true });


// initialise Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISH_KEY!
);


// GET Items
// Volunteer requesting list of filtered items
// US 10

app.get("/items", async (request, reply) => {
  const authHeader = request.headers.authorization;

  // check auth header format, return error when invalid
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({
      error: "Missing or invalid authorisation header"
    });
  }

  const token = authHeader.substring("Bearer ".length);

  // get current user, check for authorisation
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return reply.status(401).send({
      error: "Unauthorised"
    });
  }

  const supabaseUser = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISH_KEY!,
      {
        accessToken: async() => token
      }
    )

  // get item list
  const { data, error } = await supabaseUser
    .from("items")
    .select("*");


  if (error) {
    return reply.status(500).send({
      error: error.message
    });
  }

  return reply.send(data);
});