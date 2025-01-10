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

interface Bid {
  buyer_name: string;
  amount: number;
  timestamp: Date;
}

const AuctionPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [isBidding, setIsBidding] = useState(false);
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

  const handleBidding = async (incrementAmount: number) => {
    if (user && selectedPlayer) {
      try {
        const { data: currentData, error: fetchError } = await supabase
          .from("buyers")
          .select("*")
          .eq("id", user?.user?.id)
          .single();

        if (fetchError) throw new Error(fetchError.message);

        const totalBidAmount = currentBid + incrementAmount;

        if (currentData?.balance < totalBidAmount) {
          alert(
            "You don't have enough balance. Please add money to your account to buy the player."
          );
          return;
        }

        // const updatedTeamList = [
        //   ...(currentData?.team_list || []),
        //   selectedPlayer.id,
        // ];

        // const { data, error } = await supabase
        //   .from("buyers")
        //   .update({ team_list: updatedTeamList })
        //   .eq("id", user?.user?.id);

        // if (error) throw new Error(error.message);

        // const { data: playerData, error: playerError } = await supabase
        //   .from("players")
        //   .update({ team_id: user?.user?.id, sold: true })
        //   .eq("id", selectedPlayer.id);

        const updatedBalance = currentData.balance - totalBidAmount;

        const { data: balanceData, error: balanceError } = await supabase
          .from("buyers")
          .update({ balance: updatedBalance })
          .eq("id", user?.user?.id);

        setBids([
          ...bids,
          {
            buyer_name: currentData.name || "Unknown Buyer",
            amount: totalBidAmount,
            timestamp: new Date(),
          },
        ]);
        alert("Bid placed");
        // setPlayers(
        //   players.map((p) =>
        //     p.id === selectedPlayer.id ? { ...p, sold: true } : p
        //   )
        // );
      } catch (err) {
        console.error("Failed to place bid:", err);
      }
      alert("Bid placed");
    }
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
      <div className="container mx-auto p-6 mb-8">
        {selectedPlayer && (
          <div className="bg-black bg-opacity-90 rounded-lg overflow-hidden">
            <div className="grid grid-cols-3 gap-0">
              <div className="p-6 border-r border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">
                  Current Bids
                </h3>
                <div className="space-y-3">
                  {bids.map((bid, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-400">{bid.buyer_name}</span>
                      <span className="text-yellow-500">
                        ₹{bid.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {bids.length === 0 && (
                    <div className="text-gray-400">No bids placed yet.</div>
                  )}
                </div>
                <div className="mt-4 p-4 bg-gray-800 rounded-lg text-center">
                  <h4 className="text-lg font-bold text-white">Total Bids</h4>
                  <div className="text-yellow-500 font-bold text-2xl">
                    ₹
                    {bids
                      .reduce((total, bid) => total + bid.amount, 0)
                      .toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6">
                <div className="relative w-48 h-48">
                  <img
                    src={selectedPlayer.image_url}
                    alt={selectedPlayer.name}
                    className="w-48 h-48 rounded-full object-cover border-4 border-yellow-500"
                  />
                </div>
                <h2 className="text-2xl font-bold text-white mt-4">
                  {selectedPlayer.name}
                </h2>
                <div className="text-3xl font-bold text-yellow-500 mt-2">
                  ₹{selectedPlayer.base_price.toLocaleString()}
                </div>
              </div>

              <div className="p-6 border-l border-gray-800">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-400">Batting Rating: </span>
                    <span className="text-white">
                      {selectedPlayer.batting_rating}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Bowling Rating: </span>
                    <span className="text-white">
                      {selectedPlayer.bowling_rating}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Status: </span>
                    <span className="text-white">{selectedPlayer.status}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Country: </span>
                    <span className="text-white">IND</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">IPL 2024: </span>
                    <span className="text-white">DC</span>
                  </div>
                </div>
                <button
                  onClick={() => handleBidding(selectedPlayer.base_price)}
                  className="w-full mt-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded"
                >
                  PLACE BID
                </button>
                <div className="flex gap-5 text-black my-5 font-bold">
                  <span
                    className="bg-yellow-500 rounded-2xl p-2"
                    onClick={() => handleBidding(5000)}
                  >
                    +5000 ₹
                  </span>
                  <span
                    className="bg-yellow-500 rounded-2xl p-2"
                    onClick={() => handleBidding(10000)}
                  >
                    +10000 ₹
                  </span>
                  <span
                    className="bg-yellow-500 rounded-2xl p-2"
                    onClick={() => handleBidding(20000)}
                  >
                    +25000 ₹
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid showing available players */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {players
            .filter((player) => !player.sold)
            .map((player) => (
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
                  className={`px-4 py-2 mt-2 text-white rounded-lg
                  ${
                    !player.sold
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-gray-500 cursor-not-allowed"
                  }`}
                  onClick={() => setSelectedPlayer(player)}
                  disabled={player.sold}
                >
                  {player.sold ? "SOLD" : "Place Bid"}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;
