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


// POST Accept
// Volunteer accepts a pending item/request
// US 11

export default async function itemAPI(app: FastifyInstance) {
  app.post("/items/:id/accept", async (request, reply) => {
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

    
    // obtain user ID
    const { id } = request.params as { id: string };

    
    // check item status, return error if not found or item unavailable
    const {
      data: item,
      error: itemError,
    } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (itemError || !item) {
      return reply.status(404).send({ error: "Item not found" });
    }

    if (item.status !== "pending") {
      return reply
        .status(409)
        .send({ error: "Item is no longer available" });
    }


    // create pickup
    const {
      data: pickup,
      error: pickupError,
    } = await supabase
      .from("pickups")
      .insert({
        item_id: id,
        volunteer_id: user.id,
        status: "assigned",
      })
      .select()
      .single();

    if (pickupError || !pickup) {
      request.log.error(pickupError);

      return reply
        .status(500)
        .send({ error: "Failed to accept item" });
    }


    // update item status to be "accepted" after pickup creation
    const {
      data: updatedItem,
      error: updateError,
    } = await supabase
      .from("items")
      .update({ status: "accepted" })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedItem) {
      request.log.error(updateError);

      return reply
        .status(500)
        .send({ error: "Pickup created but failed to update item status" });
    }

    
    // return pickup
    return reply.status(201).send(pickup);
  });
}