import "dotenv/config";
import Fastify from "fastify";
import { createClient } from "@supabase/supabase-js";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import multipart from "@fastify/multipart"

const app = Fastify({ logger: true });


// initialise Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
);


// GET Requests
// Volunteer requesting list of filtered items
// US 10

export default async function requestAPI(app: FastifyInstance) {

    app.get("/requests", async (request, reply) => {
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
        process.env.SUPABASE_PUBLISHABLE_KEY!,
        {
            accessToken: async() => token
        }
        )

    // get request list
    const { data, error } = await supabaseUser
        .from("requests")
        .select(`
            id,
            description,
            pickup_location,
            dropoff_location,
            urgency,
            pickup_lat,
            pickup_lng,
            dropoff_lat,
            dropoff_lng,
            tag,
            total_package_size,
            request_items (
              id,
              item_type,
              quantity
            )
        `)
        .eq("status", "pending");

    if (error) {
        return reply.status(500).send({
        error: error.message
        });
    }

    return reply.send(data);
    });


    // POST Accept
    // Volunteer accepts a pending request
    // US 11
    app.post("/requests/:id/accept", async (request, reply) => {
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
        process.env.SUPABASE_PUBLISHABLE_KEY!,
        {
            accessToken: async() => token
        }
        )

      
      // obtain request ID
      const { id } = request.params as { id: string };

      
      // check request status, return error if not found or request unavailable
      const {
        data,
        error,
      } = await supabaseUser
        .from("requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return reply.status(404).send({ error: "Request not found" });
      }

      if (data.status !== "pending") {
        return reply
          .status(409)
          .send({ error: "Request is no longer available" });
      }


      // create pickup
      const {
        data: pickup,
        error: pickupError,
      } = await supabaseUser
        .from("pickups")
        .insert({
          request_id: id,
          volunteer_id: user.id,
          status: "assigned",
        })
        .select()
        .single();

      if (pickupError || !pickup) {
        request.log.error(pickupError);

        return reply
          .status(500)
          .send({ error:pickupError, message: "Failed to accept request" });
      }


      // update request status to be "accepted" after pickup creation
      const {
        data: updatedItem,
        error: updateError,
      } = await supabaseUser
        .from("requests")
        .update({ 
          status: "accepted",
          accepted_at: new Date().toISOString(), 
          volunteer_id: user.id
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError || !updatedItem) {
        request.log.error(updateError);

        return reply
          .status(500)
          .send({ error: "Pickup created but failed to update request status" });
      }

          
      // return pickup
      return reply.status(201).send(pickup)
      });



    app.get("/accepted-requests", async (request, reply) => {
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
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
              accessToken: async() => token
          }
          )
  
      // get request list
      const { data, error } = await supabaseUser
          .from("requests")
          .select(`
              id,
              description,
              pickup_location,
              dropoff_location,
              urgency,
              pickup_lat,
              pickup_lng,
              dropoff_lat,
              dropoff_lng,
              tag,
              total_package_size,
              request_items (
                id,
                item_type,
                quantity
              )
          `)
          .eq("status", "accepted")
          .eq("volunteer_id", user.id);
  
      if (error) {
          return reply.status(500).send({
          error: error.message
          });
      }
  
      return reply.send(data);
      });

    // POST Cancel
    // Volunteer cancels a request which they accepted earlier
    app.post("/requests/:id/cancel", async (request, reply) => {
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
        process.env.SUPABASE_PUBLISHABLE_KEY!,
        {
            accessToken: async() => token
        }
        )
  
      
      // obtain request ID
      const { id } = request.params as { id: string };
  
      
      // check request status, return error if not found or item unavailable
      const {
        data,
        error,
      } = await supabaseUser
        .from("requests")
        .select("*")
        .eq("id", id)
        .single();
  
      if (error || !data) {
        return reply.status(404).send({ error: "Request not found" });
      }
  
      if (data.status !== "accepted") {
        return reply
          .status(409)
          .send({ error: "Request is not accepted or already in transit" });
      }
  
  
      // delete pickup row
      const { 
        data: pickupId, 
        error: pickupError} = await supabaseUser
        .from("pickups")
        .delete()
        .eq("request_id", id)
        .eq("volunteer_id", user.id)
        .select("id")
        .maybeSingle();
  
      if (!pickupId) {
        request.log.error(pickupError);
  
        return reply
          .status(500)
          .send({ error: "Failed to find pickup" });
      }
  
  
      // update request status to be "pending" after pickup deletion
      const {
        data: updatedItem,
        error: updateError,
      } = await supabaseUser
        .from("requests")
        .update({ status: "pending", volunteer_id: null})
        .eq("id", id)
        .select()
        .single();
  
      if (updateError || !updatedItem) {
        request.log.error(updateError);
  
        return reply
          .status(500)
          .send({ error: "Pickup created but failed to update item status" });
      }
  
          
      return reply.status(200).send(updatedItem);
    });



    // GET new request
    // Admin request newly accepted requests
    app.get("/admin/requests/accepted", async (request, reply) => {
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
          data,
          error
        } = await supabaseUser
          .from("requests")
          .select(`
            organisations (
              name
            ),
            id,
            description,
            request_items (
              item_type,
              quantity
            ),
            urgency,
            status,
            accepted_at
          `)
          .eq("status", "accepted")
          .gt("accepted_at", after)
          .order("accepted_at", { ascending: true })
          .limit(100);

        if (error) {
          request.log.error(error);

          return reply.status(500).send({
            error: "Failed to retrieve accepted items",
          });
        }

        const results = data ?? [];

        // return results
        return reply.status(200).send({
          requests: results
        });
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          error: "Internal server error",
        });
      }
    });

    // POST Upload Handover Photo
    // Volunteer uploads photo evidence for a delivery handover
    app.post("/pickups/:id/handover-photo", async (request, reply) => {
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

        const { id: pickupId } = request.params as { id: string };

        const supabaseUser = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            accessToken: async () => token,
          }
        );

        // verify that this pickup belongs to the current volunteer
        const {
          data: pickup,
          error: pickupError,
        } = await supabaseUser
          .from("pickups")
          .select("id, volunteer_id, status")
          .eq("id", pickupId)
          .eq("volunteer_id", user.id)
          .maybeSingle();

        if (pickupError) {
          request.log.error(pickupError);

          return reply.status(500).send({
            error: "Failed to retrieve pickup",
          });
        }

        if (!pickup) {
          return reply.status(404).send({
            error: "Pickup not found",
          });
        }

        // only allow handover after pickup has been collected
        if (pickup.status !== "picked_up") {
          return reply.status(409).send({
            error: "Pickup is not ready for handover",
            message: "The pickup must be in picked_up status.",
          });
        }

        // read the uploaded file
        const file = await request.file();

        if (!file) {
          return reply.status(400).send({
            error: "PHOTO_REQUIRED",
            message: "Please upload a handover photo.",
          });
        }

        const extensionByMimeType: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };

        const extension = extensionByMimeType[file.mimetype];

        if (!extension) {
          file.file.resume();

          return reply.status(415).send({
            error: "UNSUPPORTED_IMAGE_TYPE",
            message: "Only JPEG, PNG and WebP images are supported.",
          });
        }

        let buffer: Buffer;

        try {
          buffer = await file.toBuffer();
        } catch {
          return reply.status(413).send({
            error: "FILE_TOO_LARGE",
            message: "The image must not exceed 5 MB.",
          });
        }

        if (file.file.truncated) {
          return reply.status(413).send({
            error: "FILE_TOO_LARGE",
            message: "The image must not exceed 5 MB.",
          });
        }

        // generate a unique storage path
        const storagePath =
          `${user.id}/${pickupId}/${randomUUID()}.${extension}`;

        const {
          error: uploadError,
        } = await supabaseUser.storage
          .from("handover-photos")
          .upload(storagePath, buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          request.log.error(uploadError);

          return reply.status(500).send({
            error: "PHOTO_UPLOAD_FAILED",
            message: "Failed to upload handover photo.",
          });
        }

        // save photo metadata and complete the handover
        const handoverTimestamp = new Date().toISOString();

        const {
          data: updatedPickup,
          error: updateError,
        } = await supabaseUser
          .from("pickups")
          .update({
            handover_photo_path: storagePath,
            handover_timestamp: handoverTimestamp,
            status: "delivered",
          })
          .eq("id", pickupId)
          .eq("volunteer_id", user.id)
          .eq("status", "picked_up")
          .select(
            "id, status, handover_photo_path, handover_timestamp"
          )
          .maybeSingle();

        if (updateError || !updatedPickup) {
          if (updateError) {
            request.log.error(updateError);
          }

          // cleanup if the database update failed
          const { error: cleanupError } = await supabaseUser.storage
            .from("handover-photos")
            .remove([storagePath]);

          if (cleanupError) {
            request.log.error(cleanupError);
          }

          return reply.status(409).send({
            error: "HANDOVER_UPDATE_FAILED",
            message:
              "The handover could not be completed. Please refresh and try again.",
          });
        }

        // return the updated pickup
        return reply.status(200).send({
          message: "Handover photo uploaded successfully",
          pickup: updatedPickup,
        });
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          error: "Internal server error",
        });
      }
    });


    // POST new request
    // Admin create a new request
    app.post("/admin/create-request", async (request, reply) => {
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

      const body = request.body as {
        organisation_id: string;
        description: string;
        pickup_location: unknown;
        dropoff_location: unknown;
        urgency: string;
        items: {
          item_type: string;
          quantity: number;
        }[];
      }

      // create the request
      const { data: newRequest, error: requestError } =
      await supabaseUser
        .from("requests")
        .insert({
          organisation_id: body.organisation_id ?? null,
          created_by_admin: true,
          description: body.description.trim(),
          pickup_location: body.pickup_location,
          dropoff_location: body.dropoff_location,
          urgency: body.urgency ?? "medium",
          status: "pending",
        })
        .select("id")
        .single();

      if (requestError || !newRequest) {
        request.log.error(
          { err: requestError },
          "Failed to create request"
        );

        return reply.status(500).send({
          error: "Failed to create request",
        });
      }

      // create all request_items
      const itemRows = body.items.map((item) => ({
        request_id: newRequest.id,
        item_type: item.item_type.trim(),
        quantity: item.quantity,
      }));

      const { data: createdItems, error: itemsError } =
        await supabaseUser
          .from("request_items")
          .insert(itemRows)
          .select("id, item_type, quantity");

      if (itemsError) {
        request.log.error(
          { err: itemsError, requestId: newRequest.id },
          "Failed to create request items"
        );

        return reply.status(500).send({
          error: "Request was created, but its items could not be saved",
          request_id: newRequest.id,
        });
      }

      return reply.status(201).send({
        message: "Request created successfully",
        request_id: newRequest.id,
        items: createdItems,
      });
  });
}