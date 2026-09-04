import type { FastifyInstance } from "fastify";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export default async function routeAPI(app: FastifyInstance) {

    // POST Route
    // Volunteer creates a new route and mark as planned
    // US 13

    app.post("/routes", async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return reply
        .status(401)
        .send({ error: "Missing or invalid authorisation header" });
    }

    const token = authHeader.substring("Bearer ".length);

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return reply.status(401).send({ error: "Unauthorised" });
    }

    // create a new route
    const {
        data: route,
        error: routeError,
    } = await supabase
        .from("routes")
        .insert({
        volunteer_id: user.id,
        status: "planned",
        })
        .select()
        .single();

    if (routeError || !route) {
        request.log.error(routeError);

        return reply
        .status(500)
        .send({ error: "Failed to create route" });
    }

    // return created route
    return reply.status(201).send(route);
    });


    // POST Route
    // Volunteer user start the route
    // US 12
    app.post("/routes/:id/start", async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return reply
        .status(401)
        .send({ error: "Missing or invalid authorisation header" });
    }

    const token = authHeader.substring("Bearer ".length);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return reply.status(401).send({ error: "Unauthorised" });
    }


    // get route ID
    const { id } = request.params as { id: string };

    // check if the route belongs to the requesting volunteer
    const {
      data: route,
      error: routeError,
    } = await supabase
      .from("routes")
      .select("*")
      .eq("id", id)
      .eq("volunteer_id", user.id)
      .single();

    if (routeError || !route) {
      return reply.status(404).send({ error: "Route not found" });
    }

    // ensure the route's status is "planned"
    if (route.status !== "planned") {
      return reply
        .status(409)
        .send({ error: "Route cannot be started" });
    }


    // start the route
    const {
      data: updatedRoute,
      error: updateError,
    } = await supabase
      .from("routes")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("volunteer_id", user.id)
      .select()
      .single();

    if (updateError || !updatedRoute) {
      request.log.error(updateError);

      return reply
        .status(500)
        .send({ error: "Failed to start route" });
    }

    // return updated route
    return reply.send(updatedRoute);
  });

}