"use client";
import useSupabase from "@/utils/hooks/useSupabase";
import React, { useState, useEffect } from "react";

interface Player {
  id: number;
  name: string;
  image_url: string;
  base_price: number;
  batting_rating: number;
  bowling_rating: number;
  status: string;
  team_id: number;
  sold: boolean;
  isBiddingRunning: boolean;
}

const AdminAuctionPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const supabase = useSupabase();

  useEffect(() => {
    if (supabase) {
      const fetchPlayers = async () => {
        const { data, error } = await supabase.from("players").select("*");
        if (error) {
          console.error("Error fetching players:", error);
          return;
        }
        setPlayers(data || []);
      };
      fetchPlayers();
    }
  }, [supabase]);

  const startBidding = async (player: Player) => {
    try {
      const { error } = await supabase
        .from("players")
        .update({ isBiddingRunning: true })
        .eq("id", player.id);

      if (error) throw new Error(error.message);

      setPlayers((prevPlayers) =>
        prevPlayers.map((p) =>
          p.id === player.id ? { ...p, isBiddingRunning: true } : p
        )
      );
    } catch (error) {
      console.error("Error starting bidding:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-black bg-opacity-50 p-4 rounded-lg shadow-lg text-center"
            >
              <img
                src={player.image_url}
                alt={player.name}
                className="w-32 h-32 object-cover rounded-full mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold text-white mb-2">
                {player.name}
              </h3>
              <div className="text-yellow-500 font-bold mb-2">
                ₹{player.base_price.toLocaleString()}
              </div>
              <button
                className={`px-4 py-2 mt-2 text-white rounded-lg ${
                  !player.sold && !player.isBiddingRunning
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
                onClick={() => startBidding(player)}
                disabled={player.sold || player.isBiddingRunning}
              >
                {player.sold
                  ? "SOLD"
                  : player.isBiddingRunning
                  ? "Bidding in Progress"
                  : "Start Bidding"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAuctionPage;
