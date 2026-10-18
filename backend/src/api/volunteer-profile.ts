import "dotenv/config";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { createClient } from "@supabase/supabase-js";
import { hashSecurityAnswer } from "../utils/security-answer.js";
import { verifySecurityAnswer } from "../utils/security-answer.js";
import * as process from "process";

const app = Fastify({ logger: true });


// initialise Supabase client


const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL : "";
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabasePublishableKey || !supabaseSecretKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
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
      .select(`
        id,
        email,
        full_name,
        phone,
        vehicle_type,
        availability,
        preferred_package_size,
        status,
        created_at
      `)
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
      // service_area?: unknown;
      availability?: unknown;
      preferred_package_size?: string;
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
      // ...(body.service_area !== undefined && {
      //   service_area: body.service_area
      // }),
      ...(body.availability !== undefined && {
        availability: body.availability
      }),
      ...(body.preferred_package_size !== undefined && {
        preferred_package_size: body.preferred_package_size
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
        full_name: string;
        phone?: string;
        // vehicleType?: string;
        // serviceArea?: {
        //   latitude: number;
        //   longitude: number;
        // };
        preferred_package_size?: string;
        // availability?: Record<string, boolean>;
        security_question_one?: string;
        security_question_two?: string;
        security_answer_one?: string;
        security_answer_two?: string;
      };

      const {
        email,
        password,
        full_name,
        phone,
        // vehicleType,
        // serviceArea,
        // availability,
        preferred_package_size,
        security_question_one,
        security_question_two,
        security_answer_one,
        security_answer_two,
      } = body;


      // raise error when basic data are empty
      if (!email || !password || !full_name) {
        return reply.status(400).send({
          error: "MISSING_CREDENTIAL",
          message: "email, password and fullName are required",
        });
      }

      // password security check
      if (password.length < 6) {
        return reply.status(400).send({
          error: "WRONG_FORMAT",
          message: "Password must be at least 6 characters long",
        });
      }

      // hash security answers
      var a_one_hashed, a_two_hashed;
      if (security_answer_one){
        a_one_hashed = await hashSecurityAnswer(security_answer_one);
      } else {
        a_one_hashed = null;
      }
      if (security_answer_two){
        a_two_hashed = await hashSecurityAnswer(security_answer_two);
      } else {
        a_two_hashed = null;
      }
      const security_answer_one_hashed = a_one_hashed, security_answer_two_hashed = a_two_hashed;


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
          error: "FAIL_CREATE",
          message: "Failed to create user account",
        });
      }

      const userId = authData.user.id;

      
      // insert registration data into Volunteer table, 
      // with status being "pending_vetting"
      const { error: volunteerError } = await supabase
        .from("volunteers")
        .insert({
          id: userId,
          email: email,
          full_name: full_name,
          phone: phone ?? null,
          // vehicle_type: vehicleType ?? null,
          // service_area: serviceArea
          //   ? `POINT(${serviceArea.longitude} ${serviceArea.latitude})`
          //   : null,
          preferred_package_size: preferred_package_size,
          // availability: availability ?? null,
          status: "pending_vetting",
          security_question_one: security_question_one,
          security_question_two: security_question_two,
          security_answer_one: security_answer_one_hashed,
          security_answer_two: security_answer_two_hashed,
        });

      if (volunteerError) {
        request.log.error(
          { err: volunteerError, userId },
          "Failed to create volunteer profile"
        );
      
        try {
          const { error: deleteError } =
            await supabaseAdmin.auth.admin.deleteUser(userId);
      
          if (deleteError) {
            request.log.error(
              { err: deleteError, userId },
              "Failed to clean up Supabase Auth user"
            );
          }
        } catch (cleanupError) {
          request.log.error(
            { err: cleanupError, userId },
            "Unexpected error while cleaning up Auth user"
          );
        }
      
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
          error: "MISSING_CREDENTIAL",
          message: "email and password are both required"
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
            message: authError.message,
          });
        }
  
      if (!authData.user) {
          return reply.status(500).send({
            error: "USER_NOT_FOUND",
            message: "User not found",
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
          error: "AWAITING_VETTING",
          message: "Your information is awaiting vetting! Please wait for notification",
        });
      } else if (volunteerData.status === "inactive") {
        return reply.status(403).send({
          error: "INACTIVE",
          message: "Account not usable",
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

  
  type ResetPasswordBody = {
    security_question_one: string;
    security_answer_one: string;
    security_question_two: string;
    security_answer_two: string;
    new_password: string;
  };

  function normaliseQuestion(question: string): string {
    return question
      .normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  app.post<{ Body: ResetPasswordBody }>(
    "/volunteers/reset-password",
    async (request, reply) => {
      try {
        // read the access token from the request header.
        const token = request.headers.authorization
        ?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

        if (!token) {
          return reply.status(401).send({
            error: "Authentication required",
          });
        }

        // validate the request body.
        const {
          security_question_one,
          security_answer_one,
          security_question_two,
          security_answer_two,
          new_password,
        } = request.body ?? ({} as ResetPasswordBody);

        if (
          typeof security_question_one !== "string" ||
          typeof security_answer_one !== "string" ||
          typeof security_question_two !== "string" ||
          typeof security_answer_two !== "string" ||
          typeof new_password !== "string" ||
          !security_question_one.trim() ||
          !security_answer_one.trim() ||
          !security_question_two.trim() ||
          !security_answer_two.trim() ||
          !new_password
        ) {
          return reply.status(400).send({
            error: "All fields are required",
          });
        }

        if (new_password.length < 8) {
          return reply.status(400).send({
            error: "New password does not meet the requirements",
          });
        }

        // create a client scoped to this user's token.
        const supabaseUser = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            accessToken: async() => token
          }
        )

        // validate the token and obtain the trusted user ID.
        const {
          data: { user },
          error: authError,
        } = await supabaseUser.auth.getUser(token);

        if (authError || !user) {
          return reply.status(401).send({
            error: "Invalid or expired access token",
          });
        }

        // read this user's security questions and answer hashes.
        const { data: volunteer, error: lookupError } =
        await supabaseUser
          .from("volunteers")
          .select(
            "id, security_question_one, security_question_two, security_answer_one, security_answer_two"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (lookupError) {
          request.log.error(
            { err: lookupError, userId: user.id },
            "Failed to retrieve volunteer security settings"
          );

          return reply.status(500).send({
            error: "Unable to process password change",
          });
        }

        if (
          !volunteer ||
          !volunteer.security_answer_one ||
          !volunteer.security_answer_two
        ) {
          return reply.status(400).send({
            error: "IDENTITY_ERROR",
            message: "Unable to verify identity",
          });
        }

        // check the submitted questions.
        const questionsMatch =
          normaliseQuestion(security_question_one) ===
            normaliseQuestion(
              volunteer.security_question_one ?? ""
            ) &&
          normaliseQuestion(security_question_two) ===
            normaliseQuestion(
              volunteer.security_question_two ?? ""
            );

        if (!questionsMatch) {
          return reply.status(400).send({
            error: "IDENTITY_ERROR",
            message: "Unable to verify identity",
          });
        }

        // verify both answers against their stored hashes.
        const answerOneValid = await verifySecurityAnswer(
          security_answer_one,
          volunteer.security_answer_one
        );
        
        const answerTwoValid = await verifySecurityAnswer(
          security_answer_two,
          volunteer.security_answer_two
        );

        if (!(answerOneValid || answerTwoValid)) {
          return reply.status(400).send({
            error: "IDENTITY_ERROR",
            message: "Unable to verify identity",
          });
        }

        // update the password using the authenticated user's token.
        const updateResponse = await fetch(
          `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`,
          {
            method: "PUT",
            headers: {
              apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              password: new_password,
            }),
          }
        );

        if (!updateResponse.ok) {
          request.log.warn(
            {
              statusCode: updateResponse.status,
              userId: user.id,
            },
            "Supabase Auth rejected password update"
          );

          if (
            updateResponse.status === 400 ||
            updateResponse.status === 422
          ) {
            return reply.status(400).send({
              error: "New password was rejected",
            });
          }

          if (updateResponse.status === 401) {
            return reply.status(401).send({
              error: "Invalid or expired access token",
            });
          }

          return reply.status(500).send({
            error: "Unable to update password",
          });
        }

        return reply.status(200).send({
          message: "Password updated successfully",
        });
      } catch (error) {
        request.log.error(
          { err: error },
          "Unexpected password change error"
        );

        return reply.status(500).send({
          error: "Unable to process password change",
        });
      }
    }
  );

  

}
