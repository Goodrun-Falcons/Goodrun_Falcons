import "dotenv/config";
import Fastify from "fastify";
import { createClient } from "@supabase/supabase-js";

const app = Fastify({ logger: true });


// initialise Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISH_KEY!
);


// POST Routes
// volunteer user 
app.post("/routes", async (request, reply) => {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({
      error: "Missing or invalid authorisation header"
    });
  }

  const token = authHeader.substring("Bearer ".length);

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
      accessToken: async () => token
    }
  );

  
  const { data, error } = await supabaseUser
    .from("routes")
    .insert({
      volunteer_id: user.id,
      status: "planned"
    })
    .select()
    .single();

  if (error) {
    return reply.status(500).send({
      error: error.message
    });
  }

  return reply.status(201).send(data);
});