"use client";
import { useEffect, useState } from "react";
import BalanceForm from "@/components/BalanceForm";
import Navbar from "@/components/Navbar";
import PlayerList from "@/components/TeamPlayersList";
import { Landmark } from "lucide-react";
import useUser from "@/utils/hooks/useUser";
import useSupabase from "@/utils/hooks/useSupabase";
import { buyersProps } from "@/utils/types";

export default function AuctionForm() {
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const { user } = useUser();
  const supabase = useSupabase();
  const [buyersData, setBuyersData] = useState<buyersProps | null>(null);
  console.log("user", user);

  const toggleBalanceForm = () => {
    setShowBalanceForm(!showBalanceForm);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (supabase && user) {
        try {
          const { data, error } = await supabase
            .from("buyers")
            .select("*")
            .eq("id", user?.id);

          if (error) {
            throw error;
          }

          setBuyersData(data[0]);
          console.log("data", data[0]);
        } catch (error) {
          console.log("error", error);
        }
      }
    };

    fetchData();
    return () => {
      setBuyersData(null);
    };
  }, [supabase, user]);
  console.log("buyersData?.balance", buyersData);

  return (
    <>
      <Navbar />
      <div className="w-full bg-gray-100 flex flex-col sm:flex-row justify-between items-center px-5 py-4 space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-3">
          <Landmark />
          <span className="text-gray-800 font-semibold">
            Current Balance: {buyersData?.balance}
          </span>
        </div>

        <span
          className="cursor-pointer text-blue-600 hover:underline text-sm"
          onClick={toggleBalanceForm}
        >
          {showBalanceForm ? "See your Team " : "Want to add balance?"}
        </span>
      </div>

      {showBalanceForm ? (
        <BalanceForm />
      ) : (
        <div className="text-center text-lg mt-5 bg-gray-100 ">
          
        </div>
      )}
    </>
  );
}
