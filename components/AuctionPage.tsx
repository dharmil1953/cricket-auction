"use client";
import useSupabase from "@/utils/hooks/useSupabase";
import useUser from "@/utils/hooks/useUser";
import React, { useEffect, useState } from "react";

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
}

const AuctionPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const supabase = useSupabase();
  const user = useUser();

  useEffect(() => {
    const fetchPlayers = async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase.from("players").select("*");
          if (error) throw new Error(error.message);
          setPlayers(data);
        } catch (err) {
          setError("Failed to fetch players.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchPlayers();
  }, [supabase]);

  const handleBidding = async () => {
    if (user && selectedPlayer) {
      try {
        const { data: currentData, error: fetchError } = await supabase
          .from("buyers")
          .select("team_list, balance")
          .eq("id", user?.user?.id)
          .single();

        if (fetchError) throw new Error(fetchError.message);

        if (currentData?.balance < selectedPlayer.base_price) {
          alert(
            "You don't have enough balance. Please add money to your account to buy the player."
          );
          return;
        }

        const updatedTeamList = [
          ...(currentData?.team_list || []),
          selectedPlayer.id,
        ];

        const { data, error } = await supabase
          .from("buyers")
          .update({ team_list: updatedTeamList })
          .eq("id", user?.user?.id);

        if (error) throw new Error(error.message);
        console.log("Updated Team List:", data);

        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .update({ team_id: user?.user?.id, sold: true })
          .eq("id", selectedPlayer.id);

        const updatedBalance = currentData.balance - selectedPlayer.base_price;

        const { data: balanceData, error: balanceError } = await supabase
          .from("buyers")
          .update({ balance: updatedBalance })
          .eq("id", user?.user?.id);
      } catch (err) {
        console.error("Failed to place bid:", err);
      }
    } else {
      console.log("User or Player is not selected.");
    }
    alert("congratulations! Player is added to your team");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-2xl font-bold text-white animate-pulse">
          Loading Auction House...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-black bg-opacity-40 border-b border-gray-700">
        <div className="container mx-auto py-4 px-6">
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-yellow-500">
                LIVE AUCTION
              </h1>
              <div className="flex space-x-4">
                <div className="px-4 py-1 bg-green-500 bg-opacity-20 rounded-full border border-green-500">
                  <span className="text-green-400">
                    Available: {players.filter((p) => !p.sold).length}
                  </span>
                </div>
                <div className="px-4 py-1 bg-blue-500 bg-opacity-20 rounded-full border border-blue-500">
                  <span className="text-blue-400">
                    Sold: {players.filter((p) => p.sold).length}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xl font-bold text-yellow-500">
              Current Season 2024
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {selectedPlayer && (
          <div className="container mx-auto p-6 mb-8 bg-black bg-opacity-50 rounded-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">Current Bid</h2>
            <div className="flex items-center space-x-6">
              <img
                src={selectedPlayer.image_url}
                alt={selectedPlayer.name}
                className="w-32 h-32 object-cover rounded-full"
              />
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold text-white">
                  {selectedPlayer.name}
                </h3>
                <div className="text-xl text-yellow-500">
                  ₹{selectedPlayer.base_price.toLocaleString()}
                </div>
                <button
                  className="mt-4 py-2 px-6 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:bg-yellow-700 transition duration-300"
                  onClick={handleBidding}
                >
                  Place Bid
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {players.map((player, index) => (
            <div
              key={index}
              className="group relative bg-black bg-opacity-50 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative h-72">
                <img
                  src={player.image_url}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold
                    ${
                      player.sold
                        ? "bg-green-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {player.sold ? "SOLD" : "AVAILABLE"}
                  </span>
                </div>

                <div className="absolute top-4 right-4">
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                    #{player.status}
                  </span>
                </div>
              </div>

              <div className="p-4 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{player.name}</h3>
                    <div className="text-2xl font-bold text-yellow-500">
                      ₹{player.base_price.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Batting Power</span>
                      <span className="text-yellow-500 font-bold">
                        {player.batting_rating}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-300"
                        style={{ width: `${player.batting_rating}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Bowling Power</span>
                      <span className="text-yellow-500 font-bold">
                        {player.bowling_rating}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full transition-all duration-300"
                        style={{ width: `${player.bowling_rating}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  className={`w-full mt-4 py-2 rounded-lg font-bold text-sm transition-all duration-300
                    ${
                      !player.sold
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  disabled={player.sold}
                  onClick={() => setSelectedPlayer(player)}
                >
                  {player.sold ? "SOLD" : "AVAILABLE"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;
