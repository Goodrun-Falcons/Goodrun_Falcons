import "dotenv/config";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { createClient } from "@supabase/supabase-js";

const app = Fastify({ logger: true });


// initialise Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
);


export default async function volunteerProfileAPI(
  app: FastifyInstance
) {

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
      process.env.SUPABASE_PUBLISHABLE_KEY!,
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
      process.env.SUPABASE_PUBLISHABLE_KEY!,
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


  // POST registration data
  // Volunteer registeration
  // US 1
  app.post("/volunteers/register", async (request, reply) => {
    try {
      const body = request.body as {
        email: string;
        password: string;
        fullName: string;
        phone?: string;
        vehicleType?: string;
        serviceArea?: {
          latitude: number;
          longitude: number;
        };
        availability?: Record<string, boolean>;
      };

      const {
        email,
        password,
        fullName,
        phone,
        vehicleType,
        serviceArea,
        availability,
      } = body;


      // raise error when basic data are empty
      if (!email || !password || !fullName) {
        return reply.status(400).send({
          error: "email, password and fullName are required",
        });
      }

      // password security check
      if (password.length < 6) {
        return reply.status(400).send({
          error: "Password must be at least 6 characters long",
        });
      }


      // register using Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (authError) {
        return reply.status(400).send({
          error: authError.message,
        });
      }

      if (!authData.user) {
        return reply.status(500).send({
          error: "Failed to create user account",
        });
      }

      const userId = authData.user.id;

      
      // insert registration data into Volunteer table, 
      // with status being "pending_vetting"
      const { error: volunteerError } = await supabase
        .from("volunteers")
        .insert({
          id: userId,
          email,
          full_name: fullName,
          phone: phone ?? null,
          vehicle_type: vehicleType ?? null,
          service_area: serviceArea
            ? `POINT(${serviceArea.longitude} ${serviceArea.latitude})`
            : null,
          availability: availability ?? null,
          status: "pending_vetting",
        });

      if (volunteerError) {
        return reply.status(500).send({
          error: "Failed to create volunteer application",
        });
      }

      return reply.status(201).send({
        message: "Application submitted successfully",
        status: "pending_vetting",
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  });


  // POST login data
  // Volunteer log into the system
  // US 2
  app.post("/volunteers/login", async (request, reply) => {
    try {
      const body = request.body as {
        email: string;
        password: string;
      };

      const {
        email,
        password,
      } = body;


      // raise error when basic data are empty
      if (!email || !password) {
        return reply.status(400).send({
          error: "email and password are both required"
        });
      }


      // sign in using Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      

      // handle errors
      if (authError) {
          return reply.status(400).send({
            error: authError.message,
          });
        }
  
      if (!authData.user) {
          return reply.status(500).send({
            error: "User not found",
          });
        }
      

      // find volunteer entries in database
      const { data: volunteerData, error: volunteerError } = await supabase
      .from("volunteers")
      .select("status")
      .eq("id", authData.user.id)
      .single();

      if (volunteerError) {
        return reply.status(400).send({
          error: volunteerError.message,
        });
      }

      // check for volunteer status
      if (volunteerData.status === "pending_vetting") {
        return reply.status(403).send({
          error: "Your information is awaiting vetting! Please wait for notification",
        });
      } else if (volunteerData.status === "inactive") {
        return reply.status(403).send({
          error: "Account not usable",
        });
      } else if (volunteerData.status === "active") {

        // volunteer is capable to login, return success message and token
        return reply.status(200).send({
          message: "Login success",
          session: {
            accessToken: authData.session?.access_token,
            refreshToken: authData.session?.refresh_token,
          },
        });
      }

    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  });
}
