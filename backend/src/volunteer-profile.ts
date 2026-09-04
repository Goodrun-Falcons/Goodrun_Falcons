import "dotenv/config";
import Fastify from "fastify";
import { createClient } from "@supabase/supabase-js";

const app = Fastify({ logger: true });


// initialise Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISH_KEY!
);


// GET Profile
// volunteer users requesting profile data
// US 3

app.get("/volunteers/me", async (request, reply) => {
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

  // get volunteer profile, check for profile existence
  const { data, error } = await supabaseUser
    .from("volunteers")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return reply.status(404).send({
      error: "Volunteer profile not found"
    });
  }

  return reply.send(data);
});


// PATCH Profile
// volunteer users updating profile data
// US 4

app.patch("/volunteers/me", async (request, reply) => {
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


  const body = request.body as {
    full_name?: string;
    phone?: string;
    vehicle_type?: string;
    service_area?: unknown;
    availability?: unknown;
  };


  // update entries that are present in the request body
  const updates = {
    ...(body.full_name !== undefined && {
      full_name: body.full_name
    }),
    ...(body.phone !== undefined && {
      phone: body.phone
    }),
    ...(body.vehicle_type !== undefined && {
      vehicle_type: body.vehicle_type
    }),
    ...(body.service_area !== undefined && {
      service_area: body.service_area
    }),
    ...(body.availability !== undefined && {
      availability: body.availability
    })
  };

  // ensure update content is non-empty
  if (Object.keys(updates).length === 0) {
    return reply.status(400).send({
      error: "No valid fields to update"
    });
  }

  const supabaseUser = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISH_KEY!,
    {
      accessToken: async() => token
    }
  )

  // update profile data
  const { data, error } = await supabaseUser
    .from("volunteers")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  // handle any database errors
  if (error) {
    return reply.status(500).send({
      error: error.message
    });
  }


  return reply.send(data);
});

