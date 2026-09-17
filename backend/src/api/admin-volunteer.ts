import "dotenv/config";
import Fastify from "fastify";
import { createClient } from "@supabase/supabase-js";

const app = Fastify({ logger: true });


// initialise Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISH_KEY!
  );


export async function getAuthenticatedUser(
  authorization?: string
) {    
    // GET Pending
    // admin request all pending vetting volunteers
    // US 5
    app.get("/admin/volunteers/pending", async (request, reply) => {
        try {
        // check token existence
        const authorization = request.headers.authorization;
    
        if (!authorization?.startsWith("Bearer ")) {
            return reply.status(401).send({
            error: "Missing authentication token",
            });
        }
    
        const token = authorization.slice(7);
    
        // verify token
        const { data: userData, error: userError } =
            await supabase.auth.getUser(token);
    
        if (userError || !userData.user) {
            return reply.status(401).send({
            error: "Invalid authentication token",
            });
        }
    
        const user = userData.user;
        const supabaseUser = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            {
              accessToken: async () => token,
              auth: {
                persistSession: false,
                autoRefreshToken: false,
              },
            }
          );
          
    
        // reject request if user is not an admin
        const { data: adminData, error: adminError } =
            await supabaseUser
            .from("admins")
            .select("id")
            .eq("id", user.id)
            .single();
    
        if (adminError || !adminData) {
            return reply.status(403).send({
            error: "Admin access required",
            });
        }
    
        // select volunteer rows that are pending vetting
        const { data: applications, error: applicationError } =
            await supabaseUser
            .from("volunteers")
            .select(`
                id,
                email,
                full_name,
                phone,
                vehicle_type,
                service_area,
                availability,
                status,
                created_at
            `)
            .eq("status", "pending_vetting")
            .order("created_at", { ascending: true });
    
        if (applicationError) {
            request.log.error(applicationError);
    
            return reply.status(500).send({
            error: "Failed to retrieve applications",
            });
        }
    
        return reply.status(200).send({
            applications,
        });
        } catch (error) {
        request.log.error(error);
    
        return reply.status(500).send({
            error: "Internal server error",
        });
        }
    });
}