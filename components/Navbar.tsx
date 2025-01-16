"use client";
import useSupabase from "@/utils/hooks/useSupabase";
import useUser from "@/utils/hooks/useUser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Navbar = () => {
  const supabase = useSupabase();
  const router = useRouter();

  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (data) {
          setSession(data);
        } else {
          console.error(error);
        }
      } catch (err) {
        console.log("Error fetching session:", err);
      }
    };

    fetchSession();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          {/* Left Section - Auth Button */}
          {!session ? (
            <button
              onClick={handleLogout}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 
                hover:from-yellow-600 hover:to-yellow-700 text-black font-bold transition-all 
                duration-300 transform hover:scale-105"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="px-6 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 
                hover:from-yellow-600 hover:to-yellow-700 text-black font-bold transition-all 
                duration-300 transform hover:scale-105"
            >
              Login
            </Link>
          )}

          <Link
            href="/"
            className="transform hover:scale-105 transition-transform duration-300"
          >
            <h2
              className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 
              bg-clip-text text-transparent hover:from-yellow-300 hover:to-yellow-100 
              transition-all duration-300"
            >
              Cricket Auction
            </h2>
          </Link>

          {/* Right Section - Navigation */}
          <ul className="flex gap-8 items-center">
            <li>
              <Link
                href="/my-team"
                className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 
                  relative group"
              >
                My Team
                <span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 
                  group-hover:w-full transition-all duration-300"
                ></span>
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="flex items-center justify-center w-10 h-10 rounded-full 
                  bg-gray-800 border border-gray-700 hover:border-yellow-500 
                  text-gray-300 hover:text-yellow-400 transition-all duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
