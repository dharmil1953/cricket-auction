import { useEffect, useState } from "react";
import { createClient } from "../auth-helpers/client";

const useSupabase = () => {
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    const initializeSupabase = async () => {
      const client = await createClient();
      setSupabase(client);
    };

    initializeSupabase();
  }, []);

  return supabase;
};

export default useSupabase;
