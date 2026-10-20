import type { FastifyInstance } from "fastify";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

// initialise Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
);

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



    // POST End Route
    // Volunteer ends their active route

    app.post("/routes/:id/end", async (request, reply) => {
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

      const { id: routeId } = request.params as { id: string };

      const supabaseUser = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISHABLE_KEY!,
        {
          accessToken: async () => token,
        }
      );

      // find the route that belongs to the current volunteer
      const {
        data: route,
        error: routeError,
      } = await supabaseUser
        .from("routes")
        .select("id, volunteer_id, status")
        .eq("id", routeId)
        .eq("volunteer_id", user.id)
        .maybeSingle();

      if (routeError) {
        request.log.error(routeError);

        return reply.status(500).send({
          error: "Failed to retrieve route",
        });
      }

      if (!route) {
        return reply.status(404).send({
          error: "Route not found",
        });
      }

      // only active routes can be ended
      if (route.status !== "active") {
        return reply.status(409).send({
          error: "Route is not active",
        });
      }

      // check whether there are stops that are incomplete
      const {
        data: unfinishedStops,
        error: stopsError,
      } = await supabaseUser
        .from("route_stops")
        .select("id, sequence_number, status")
        .eq("route_id", routeId)
        .neq("status", "completed")
        .limit(1);

      if (stopsError) {
        request.log.error(stopsError);

        return reply.status(500).send({
          error: "Failed to check route stops",
        });
      }

      if (unfinishedStops && unfinishedStops.length > 0) {
        return reply.status(409).send({
          error: "ROUTE_HAS_UNCOMPLETED_STOPS",
          message: "Complete all route stops before ending the route.",
        });
      }

      // end the route
      const {
        data: updatedRoute,
        error: updateError,
      } = await supabaseUser
        .from("routes")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
        })
        .eq("id", routeId)
        .eq("volunteer_id", user.id)
        .eq("status", "active")
        .select("id, volunteer_id, status, started_at, ended_at")
        .maybeSingle();

      if (updateError) {
        request.log.error(updateError);

        return reply.status(500).send({
          error: "Failed to end route",
        });
      }

      if (!updatedRoute) {
        return reply.status(409).send({
          error: "Route status has changed. Please refresh and try again.",
        });
      }

      return reply.status(200).send({
        message: "Route ended successfully",
        route: updatedRoute
      });
    });


    

      // GET Route
      // Volunteer retrieves their route with ordered stops and pickup/item details
      app.get("/routes/:id", async (request, reply) => {
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

        const { id: routeId } = request.params as { id: string };

        const supabaseUser = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            accessToken: async () => token,
          }
        );

        // retrieve the route and its related stops, pickups and items
        const {
          data: route,
          error: routeError,
        } = await supabaseUser
          .from("routes")
          .select(`
            id,
            volunteer_id,
            status,
            current_location,
            started_at,
            ended_at,
            created_at,
            route_stops (
              id,
              stop_type,
              sequence_number,
              status,
              arrival_time,
              completion_time,
              pickups (
                id,
                request_id,
                volunteer_id,
                status,
                handover_photo_url,
                handover_timestamp,
                started_at,
                ended_at,
                requests (
                  id,
                  description,
                  pickup_location,
                  dropoff_location,
                  urgency,
                  status,
                  organisation_id
                )
              )
            )
          `)
          .eq("id", routeId)
          .eq("volunteer_id", user.id)
          .order("sequence_number", {
            referencedTable: "route_stops",
            ascending: true,
          })
          .maybeSingle();

        if (routeError) {
          request.log.error(routeError);

          return reply.status(500).send({
            error: "Failed to retrieve route",
          });
        }

        if (!route) {
          return reply.status(404).send({
            error: "Route not found",
          });
        }

        return reply.status(200).send(route);
    });


      app.put("/routes/:routeId/stops", async (request, reply) => {
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

        const supabaseUser = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            accessToken: async () => token,
          }
        );
        
        const { routeId } = request.params as {
          routeId: string;
        };
      
        const body = request.body as {
          stops?: unknown;
        };
      
        // validate the complete stops array.
        if (!Array.isArray(body?.stops)) {
          return reply.status(400).send({
            message: "stops must be an array",
          });
        }
      
        const stops = body.stops as {
          pickup_id: string;
          stop_type: "pickup" | "dropoff";
          sequence_number: number;
        }[];
      
        const valid = stops.every(
          (stop) =>
            stop !== null &&
            typeof stop === "object" &&
            typeof stop.pickup_id === "string" &&
            stop.pickup_id.length > 0 &&
            ["pickup", "dropoff"].includes(stop.stop_type) &&
            Number.isSafeInteger(stop.sequence_number) &&
            stop.sequence_number > 0
        );
      
        if (!valid) {
          return reply.status(400).send({
            message: "Invalid stop data",
          });
        }
      
        // every sequence number must be unique and consecutive.
        const sequences = stops
          .map((stop) => stop.sequence_number)
          .sort((a, b) => a - b);
      
        if (!sequences.every((seq, index) => seq === index + 1)) {
          return reply.status(400).send({
            message: "Sequence numbers must be unique and consecutive from 1",
          });
        }
      
        // each pickup must have exactly one pickup stopand one dropoff stop.
        const typesByPickup = new Map<string, Set<string>>();
      
        for (const stop of stops) {
          if (!typesByPickup.has(stop.pickup_id)) {
            typesByPickup.set(stop.pickup_id, new Set());
          }
      
          const types = typesByPickup.get(stop.pickup_id)!;
      
          if (types.has(stop.stop_type)) {
            return reply.status(400).send({
              message: "Duplicate stop for the same pickup and stop type",
            });
          }
      
          types.add(stop.stop_type);
        }
      
        for (const types of typesByPickup.values()) {
          if (!types.has("pickup") || !types.has("dropoff")) {
            return reply.status(400).send({
              message: "Each pickup must have both pickup and dropoff stops",
            });
          }
        }
      
        // retrieve existing stops for this route.
        const {
          data: existingStops,
          error: fetchError,
        } = await supabaseUser
          .from("route_stops")
          .select("id, pickup_id, stop_type, sequence_number, status")
          .eq("route_id", routeId);
      
        if (fetchError) {
          request.log.error({ err: fetchError }, "Failed to fetch route stops");
      
          return reply.status(500).send({
            message: "Failed to retrieve route stops",
          });
        }
      
        // match a stop by its business identity.
        const keyOf = (stop: {
          pickup_id: string;
          stop_type: string;
        }) => `${stop.pickup_id}:${stop.stop_type}`;
      
        const existingByKey = new Map(
          existingStops.map((stop) => [keyOf(stop), stop])
        );
      
        const incomingKeys = new Set(stops.map(keyOf));
      
        if (incomingKeys.size !== stops.length) {
          return reply.status(400).send({
            message: "Duplicate stops are not allowed",
          });
        }
      
        // split the incoming state into inserts and updates.
        const toInsert = [];
        const toUpdate = [];
      
        for (const stop of stops) {
          const existing = existingByKey.get(keyOf(stop));
      
          if (!existing) {
            toInsert.push({
              route_id: routeId,
              pickup_id: stop.pickup_id,
              stop_type: stop.stop_type,
              sequence_number: stop.sequence_number,
              status: "pending", // Replace if your valid initial status differs.
            });
          } else if (existing.sequence_number !== stop.sequence_number) {
            toUpdate.push({
              id: existing.id,
              sequence_number: stop.sequence_number,
            });
          }
        }
      
        // insert all new stops in one operation.
        if (toInsert.length > 0) {
          const { error } = await supabaseUser
            .from("route_stops")
            .insert(toInsert);
      
          if (error) {
            request.log.error({ message: error }, "Failed to insert route stops");
      
            return reply.status(500).send({
              message: "Failed to insert new route stops",
            });
          }
        }
      
        // update sequence numbers for existing stops.
        for (const stop of toUpdate) {
          const { data: updated, error } = await supabaseUser
            .from("route_stops")
            .update({ sequence_number: stop.sequence_number })
            .eq("route_id", routeId)
            .eq("id", stop.id)
            .select("id")
            .maybeSingle();
      
          if (error || !updated) {
            request.log.error(
              { err: error, stopId: stop.id },
              "Failed to update route stop"
            );
      
            return reply.status(500).send({
              message: "Failed to update route stop",
            });
          }
        }
      
        // delete existing stops absent from the incoming state.
        const toDelete = existingStops
          .filter((stop) => !incomingKeys.has(keyOf(stop)))
          .map((stop) => stop.id);
      
        if (toDelete.length > 0) {
          const { error } = await supabaseUser
            .from("route_stops")
            .delete()
            .eq("route_id", routeId)
            .in("id", toDelete)
            .select("id");
      
          if (error) {
            request.log.error({ err: error }, "Failed to delete route stops");
      
            return reply.status(500).send({
              message: "Failed to delete obsolete route stops",
            });
          }
        }
      
        return reply.status(200).send({
          message: "Route stops synchronized successfully",
          route_id: routeId,
          stop_count: stops.length,
        });
      });
}