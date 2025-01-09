import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "../auth-helpers/client";

const client = createClient();

interface UserSession {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const useUser = (): UserSession => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await client.auth.getSession();

        if (sessionError) {
          setError("Error fetching session: " + sessionError.message);
          return;
        }

        if (!session) {
          setError("No active session found.");
          setUser(null);
          return;
        }

        const { data: userData, error: userError } =
          await client.auth.getUser();

        if (userError) {
          setError("Error fetching user: " + userError.message);
          setUser(null);
        } else {
          setUser(userData.user);
        }
      } catch (err) {
        setError("Unexpected error: " + err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
};

export default useUser;
