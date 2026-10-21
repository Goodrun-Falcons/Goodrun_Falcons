import "dotenv/config";
import Fastify from "fastify";
import { createClient } from "@supabase/supabase-js";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import multipart from "@fastify/multipart"
import { takeCoverage } from "node:v8";

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
            pickup_address,
            dropoff_address,
            total_package_size,
            request_items (
              id,
              item_type,
              quantity
            )
        `)
        .eq("status", "approved");

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

      if (data.status !== "approved") {
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


    // GET Accepted Requets
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
              pickup_address,
              dropoff_address,
              request_items (
                id,
                item_type,
                quantity
              ),
              pickups (
                id,
                route_id,
                status
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
  
      
      // check request status, return error if not found or unavailable
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
          .send({ message: error });
      }
  
  
      // update request status to be "approved" after pickup deletion
      const {
        data: updatedItem,
        error: updateError,
      } = await supabaseUser
        .from("requests")
        .update({ 
          status: "approved", 
          volunteer_id: null,
          accepted_at: null})
        .eq("id", id)
        .select()
        .single();
  
      if (updateError || !updatedItem) {
        request.log.error(updateError);
  
        return reply
          .status(500)
          .send({ error: "Pickup created but failed to update request status" });
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


        const supabaseUser = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            accessToken: async () => token,
          }
        );

        // obtain pickupId
        const { id: pickupId } = request.params as {
          id: string;
        };

        // read the uploaded file
        const file = await request.file();

        if (!file) {
          return reply.status(400).send({
            error: "PHOTO_REQUIRED",
            message: "Please upload a handover photo.",
          });
        }

        if (file.fieldname !== "photo") {
          file.file.resume();

          return reply.status(400).send({
            error: "INVALID_FILE_FIELD",
            message: 'Upload the image using the field name "photo".',
          });
        }

        // validate the file type
        const allowedMimeTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          file.file.resume();

          return reply.status(415).send({
            error: "UNSUPPORTED_IMAGE_TYPE",
            message: "Only JPEG, PNG and WebP images are supported.",
          });
        }

        // read the file into a Buffer
        let buffer: Buffer;

        try {
          buffer = await file.toBuffer();
        } catch (error) {
          if (file.file.truncated) {
            return reply.status(413).send({
              error: "FILE_TOO_LARGE",
              message: "The image must not exceed 5 MB.",
            });
          }

          request.log.error(
            { err: error },
            "Failed to read uploaded image"
          );

          return reply.status(400).send({
            error: "INVALID_UPLOAD",
            message: "Failed to read uploaded image.",
          });
        }

        if (file.file.truncated || buffer.length > 5 * 1024 * 1024) {
          return reply.status(413).send({
            error: "FILE_TOO_LARGE",
            message: "The image must not exceed 5 MB.",
          });
        }

        if (buffer.length === 0) {
          return reply.status(400).send({
            error: "EMPTY_FILE",
            message: "The uploaded image is empty.",
          });
        }

        // verify that the file content matches its claimed MIME type
        const isJpeg =
          file.mimetype === "image/jpeg" &&
          buffer.length >= 3 &&
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff;

        const isPng =
          file.mimetype === "image/png" &&
          buffer.length >= 8 &&
          buffer.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
          );

        const isWebp =
          file.mimetype === "image/webp" &&
          buffer.length >= 12 &&
          buffer.toString("ascii", 0, 4) === "RIFF" &&
          buffer.toString("ascii", 8, 12) === "WEBP";

        if (!isJpeg && !isPng && !isWebp) {
          return reply.status(415).send({
            error: "INVALID_IMAGE_CONTENT",
            message: "The file content does not match a supported image type.",
          });
        }

        // convert Buffer to PostgreSQL BYTEA hex format
        const photoBytea = "\\x" + buffer.toString("hex");

        const handoverTimestamp = new Date().toISOString();

        // store the image directly in the pickups table
        const {
          data: updatedPickup,
          error: updateError,
        } = await supabaseUser
          .from("pickups")
          .update({
            handover_photo: photoBytea,
            handover_timestamp: handoverTimestamp,
          })
          .eq("id", pickupId)
          .eq("volunteer_id", user.id)
          .select("id, handover_timestamp")
          .maybeSingle();

        if (updateError) {
          request.log.error(
            { err: updateError, pickupId, userId: user.id },
            "Failed to save handover photo"
          );

          return reply.status(500).send({
            error: "PHOTO_SAVE_FAILED",
            message: "Failed to save handover photo.",
          });
        }

        if (!updatedPickup) {
          return reply.status(404).send({
            error: "Pickup not found or you are not authorised to update it.",
          });
        }

        // return updated pickup
        return reply.status(200).send({
          message: "Handover photo saved successfully",
          pickup: updatedPickup,
        });
      } catch (error) {
        request.log.error(
          { err: error },
          "Unexpected error while saving handover photo"
        );

        return reply.status(500).send({
          error: "Internal server error",
        });
      }
    });


    // POST Pickup start
    // Volunteer starts a specfic pickup
    app.post("/pickups/:id/start", async (request, reply) => {
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

      // update pickup status to "en_route"
      const {
        error: pickupError,
      } = await supabaseUser
        .from("pickups")
        .update({status: "en_route", started_at: new Date().toISOString()})
        .eq("id", pickupId)
        .maybeSingle();

      if (pickupError) {
        request.log.error(pickupError);

        return reply.status(500).send({
          message: pickupError,
        });
      }

      // retrieve corresponding request ID
      const {
        data: requestId,
        error: reError
      } = await supabaseUser
        .from("pickups")
        .select("request_id")
        .eq("id", pickupId)
        .maybeSingle();

      if (reError) {
        request.log.error(reError);

        return reply.status(500).send({
          message: reError,
        });
      }

      if (!requestId) {
        return reply.status(409).send({
          error: "Pickup is not associated with a request",
        });
      }

      // update request status to "in_transit"
      const {
        error: requestError,
      } = await supabaseUser
        .from("requests")
        .update({status: "in_transit"})
        .eq("id", requestId.request_id)
        .maybeSingle();

      if (requestError) {
        request.log.error(requestError);

        return reply.status(500).send({
          message: requestError,
        });
      }

      return reply.status(200).send({message: "Update successed"});
  });


    // POST Pickup picked
    // Volunteer picked the request items
    app.post("/pickups/:id/picked", async (request, reply) => {
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

      // update pickup status to "picked_up"
      const {
        error: pickupError,
      } = await supabaseUser
        .from("pickups")
        .update({status: "picked_up"})
        .eq("id", pickupId)
        .maybeSingle();

      if (pickupError) {
        request.log.error(pickupError);

        return reply.status(500).send({
          message: pickupError,
        });
      }

      return reply.status(200).send({message: "Update successed"});
  });


    // POST Pickup cancel
    // Volunteer cancels a specfic pickup
    app.post("/pickups/:id/cancel", async (request, reply) => {
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

      // update pickup status to "assigned"
      const {
        error: pickupError,
      } = await supabaseUser
        .from("pickups")
        .update({status: "assigned", started_at: null})
        .eq("id", pickupId)
        .maybeSingle();

      if (pickupError) {
        request.log.error(pickupError);

        return reply.status(500).send({
          message: pickupError,
        });
      }

      // retrieve corresponding request ID
      const {
        data: requestId,
        error: reError
      } = await supabaseUser
        .from("pickups")
        .select("request_id")
        .eq("id", pickupId)
        .maybeSingle();

      if (reError) {
        request.log.error(reError);

        return reply.status(500).send({
          message: reError,
        });
      }

      if (!requestId) {
        return reply.status(409).send({
          error: "Pickup is not associated with a request",
        });
      }

      // update request status to "approved"
      const {
        error: requestError,
      } = await supabaseUser
        .from("requests")
        .update({status: "approved"})
        .eq("id", requestId.request_id)
        .maybeSingle();

      if (requestError) {
        request.log.error(requestError);

        return reply.status(500).send({
          message: requestError,
        });
      }

      return reply.status(200).send({message: "Update successed"});
  });


    // POST Pickup end
    // Volunteer ends a specfic pickup
    app.post("/pickups/:id/end", async (request, reply) => {
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

      // update pickup status to "delivered"
      const {
        error: pickupError,
      } = await supabaseUser
        .from("pickups")
        .update({status: "delivered", ended_at: new Date().toISOString()})
        .eq("id", pickupId)
        .maybeSingle();

      if (pickupError) {
        request.log.error(pickupError);

        return reply.status(500).send({
          message: pickupError,
        });
      }


      // retrieve corresponding request ID
      const {
        data: requestId,
        error: reError
      } = await supabaseUser
        .from("pickups")
        .select("request_id")
        .eq("id", pickupId)
        .maybeSingle();

      if (reError) {
        request.log.error(reError);

        return reply.status(500).send({
          message: reError,
        });
      }

      if (!requestId) {
        return reply.status(409).send({
          error: "Pickup is not associated with a request",
        });
      }

      // update request status to "delivered"
      const {
        error: requestError,
      } = await supabaseUser
        .from("requests")
        .update({status: "delivered"})
        .eq("id", requestId.request_id)
        .maybeSingle();

      if (requestError) {
        request.log.error(requestError);

        return reply.status(500).send({
          message: requestError,
        });
      }

      return reply.status(200).send({message: "Update successed"});
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
        pickup_address: string;
        dropoff_address: string;
        tag: string;
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
          status: "approved",
          tag: body.tag,
          pickup_address: body.pickup_address,
          dropoff_address: body.dropoff_address
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

    app.post("/pickups/:id/volunteer-location", async (request, reply) => {
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

      const { id: pickupId } = request.params as { id: string };

      const body = request.body as {
        current_lng: number,
        current_lat: number
      };

      // update volunteer location in pickups table
      const { data: pickup, error: pickupError } =
      await supabaseUser
        .from("pickups")
        .update({
          "current_lng": body.current_lng,
          "current_lat": body.current_lat
        })
        .eq("id", pickupId)
        .eq("volunteer_id", user.id)
        .select("*")
        .maybeSingle();

      if (pickupError || !pickup) {
        request.log.error(
          { err: pickupError }
        );

        return reply.status(500).send({
          error: "Failed to find pickup",
        });
      }

      return reply.status(200).send({
        message: "Location updated successfully",
        pickup: pickup
      });
  });
  }