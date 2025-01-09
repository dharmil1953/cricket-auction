"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/auth-helpers/server";
// import { toast } from "sonner";

export const login = async (formData: FormData) => {
  try {
    const supabase = await createClient();
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password")).trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // toast.error("Check Credentials");
      console.log("Login error:", error);
      return { status: "error", message: error.message };
    }

    if (data) {
      const user = data.user;
      const isSuperAdmin = user?.app_metadata?.role === "super-admin";

      return {
        status: "success",
        redirectUrl: isSuperAdmin ? "/admin" : "/",
      };
    }
  } catch (error) {
    console.error("Error sign in user:", error);
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
};

export const signup = async (formData: FormData) => {
  try {
    const supabase = await createClient();

    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password")).trim();
    const name = String(formData.get("name")).trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      console.log("Signup error:", error);
      // toast.error("Check Credentials");
      return { status: "error", message: error.message };
    }

    if (data) {
      return {
        status: "success",
        redirectUrl: "/sign-in",
      };
    }
  } catch (error) {
    console.error("Error during signup:", error);
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
};

export const logout = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
