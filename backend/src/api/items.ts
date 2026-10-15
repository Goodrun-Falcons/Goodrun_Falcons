import "dotenv/config";
import Fastify from "fastify";
import { createClient } from "@supabase/supabase-js";
import type { FastifyInstance } from "fastify"

const app = Fastify({ logger: true });


// initialise Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISH_KEY!
);


// GET Items
// Volunteer requesting list of filtered items
// US 10

export default async function itemAPI(app: FastifyInstance) {

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

    const supabaseUser = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISH_KEY!,
      {
          accessToken: async() => token
      }
      )

    
    // obtain item ID
    const { id } = request.params as { id: string };

    
    // check item status, return error if not found or item unavailable
    const {
      data: item,
      error: itemError,
    } = await supabaseUser
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
    } = await supabaseUser
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
    return reply.status(201).send(pickup)
    });



    // POST Cancel
    // Volunteer cancels an item which they accepted earlier
    app.post("/items/:id/cancel", async (request, reply) => {
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

      const supabaseUser = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISH_KEY!,
        {
            accessToken: async() => token
        }
        )
  
      
      // obtain item ID
      const { id } = request.params as { id: string };
  
      
      // check item status, return error if not found or item unavailable
      const {
        data: item,
        error: itemError,
      } = await supabaseUser
        .from("items")
        .select("*")
        .eq("id", id)
        .single();
  
      if (itemError || !item) {
        return reply.status(404).send({ error: "Item not found" });
      }
  
      if (item.status !== "accepted") {
        return reply
          .status(409)
          .send({ error: "Item is not accepted or already in transit" });
      }
  
  
      // delete pickup row
      const { pickup_id } = await supabaseUser
        .from("pickups")
        .delete()
        .eq("item_id", id)
        .eq("volunteer_id", user.id)
        .maybeSingle();
  
      if (!pickup_id) {
        request.log.error(pickupError);
  
        return reply
          .status(500)
          .send({ error: "Failed to find pickup" });
      }
  
  
      // update item status to be "pending" after pickup deletion
      const {
        data: updatedItem,
        error: updateError,
      } = await supabase
        .from("items")
        .update({ status: "pending" })
        .eq("id", id)
        .select()
        .single();
  
      if (updateError || !updatedItem) {
        request.log.error(updateError);
  
        return reply
          .status(500)
          .send({ error: "Pickup created but failed to update item status" });
      }
  
          
      // return item
      return reply.status(200).send(updatedItem);
    });



    // GET new item
    // Admin request newly accepted requests
    app.get("/admin/items/accepted", async (request, reply) => {
      try {
        const authHeader = request.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
          return reply.status(401).send({
            error: "Missing or invalid authorisation header",
          });
        }

        const token = authHeader.substring("Bearer ".length);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
          return reply.status(401).send({
            error: "Unauthorised",
          });
        }

        // obtain timestamp
        const { after } = request.query as {
          after?: string;
        };

        if (!after || Number.isNaN(new Date(after).getTime())) {
          return reply.status(400).send({
            error: "INVALID_TIMESTAMP",
            message: "A valid 'after' timestamp is required.",
          });
        }

        const supabaseUser = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            accessToken: async () => token,
          }
        );

        // check Admin permission
        const {
          data: admin,
          error: adminError,
        } = await supabaseUser
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (adminError) {
          request.log.error(adminError);

          return reply.status(500).send({
            error: "Failed to verify admin permissions",
          });
        }

        if (!admin) {
          return reply.status(403).send({
            error: "FORBIDDEN",
            message: "Admin access is required.",
          });
        }

        // query newly accepted items
        const {
          data: items,
          error: itemsError,
        } = await supabaseUser
          .from("items")
          .select(`
            id,
            item_type,
            quantity,
            description,
            urgency,
            status,
            accepted_at
          `)
          .eq("status", "accepted")
          .gt("accepted_at", after)
          .order("accepted_at", { ascending: true })
          .limit(100);

        if (itemsError) {
          request.log.error(itemsError);

          return reply.status(500).send({
            error: "Failed to retrieve accepted items",
          });
        }

        const results = items ?? [];

        // return results
        return reply.status(200).send({
          items: results,
          nextCursor:
            results.length > 0
              ? results[results.length - 1].accepted_at
              : after,
        });
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          error: "Internal server error",
        });
      }
});
}