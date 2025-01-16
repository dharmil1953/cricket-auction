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
  isBiddingRunning: boolean;
}

interface Buyer {
  id: number;
  name: string;
  balance: number;
}

interface AuctionResult {
  player_id: number;
  winner_id: number;
  winner_name: string;
  final_amount: number;
}

const BuyerAuctionPage = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(15);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [bids, setBids] = useState<string[]>([]);
  const [winner, setWinner] = useState<Buyer | null>(null);
  const [winningAmount, setWinningAmount] = useState<number>(0);
  const supabase = useSupabase();
  const { user } = useUser();

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from("players")
            .select("*")
            .eq("isBiddingRunning", true)
            .single();

          if (error) {
            console.log("Error fetching player:", error);
          } else {
            if (data) {
              setSelectedPlayer(data as Player);
              const { data: bidData } = await supabase
                .from("players_bid")
                .select("bids")
                .eq("id", data.id)
                .single();

              setBids(bidData?.bids || []);
            } else {
              setSelectedPlayer(null);
            }
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching player:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [supabase]);

  useEffect(() => {
    if (!selectedPlayer?.id) return;

    if (selectedPlayer?.id) {
      const channel = supabase.channel(`players_update:${selectedPlayer.id}`);
      console.log("channel");

      channel
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "players",
            filter: `id=eq.${selectedPlayer.id}`,
          },
          (payload: { new: Player }) => {
            const updatedPlayer = payload.new;
            if (
              updatedPlayer.isBiddingRunning !== selectedPlayer.isBiddingRunning
            ) {
              setSelectedPlayer(updatedPlayer);
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [supabase, selectedPlayer?.id]);

  useEffect(() => {
    const fetchBids = async () => {
      if (supabase && selectedPlayer?.id) {
        const channel = supabase.channel(`players_bid:${selectedPlayer.id}`);
        channel
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "players_bid",
            },
            (payload: { new: { bids: string[] } }) => {
              const newBids = payload.new.bids;
              setBids(newBids);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "players_bid",
            },
            (payload: { new: { bids: string[] } }) => {
              const newBids = payload.new.bids;
              setBids(newBids);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "players_bid",
            },
            () => {}
          )
          .subscribe();

        return () => {
          channel.unsubscribe();
        };
      }
    };
    fetchBids();
  }, [supabase, selectedPlayer?.id]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }

    if (timer === 0 && bids.length > 0) {
      declareWinner();
    }
  }, [timer, bids]);

  const declareWinner = async () => {
    if (!selectedPlayer || bids.length === 0) return;

    const lastBidMessage = bids[bids.length - 1];
    const [_, bidDetails] = lastBidMessage.split(": ");

    try {
      const { data: buyerData, error: buyerError } = await supabase
        .from("buyers")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (buyerError) throw new Error(buyerError.message);

      const winningBuyer = buyerData as Buyer;

      const updatedBalance =
        winningBuyer.balance - winningAmount - selectedPlayer?.base_price;

      const updatedTeamList = buyerData?.team_list || [];
      if (!updatedTeamList.includes(selectedPlayer.id)) {
        updatedTeamList.push(selectedPlayer.id);
        await supabase
          .from("buyers")
          .update({ balance: updatedBalance, team_list: updatedTeamList })
          .eq("id", winningBuyer.id);
      }
      await supabase
        .from("players")
        .update({
          sold: true,
          isBiddingRunning: false,
          team_id: buyerData?.id,
        })
        .eq("id", selectedPlayer.id);

      await supabase
        .from("players_bid")
        .update({
          buyer_id: user?.id,
          bids: [],
          total_bid_amount: winningAmount + selectedPlayer?.base_price,
        })
        .eq("id", selectedPlayer.id);

      setWinner(winningBuyer);
      alert(
        `${winningBuyer.name} has won the auction for ${
          selectedPlayer.name
        } at ₹${winningAmount + selectedPlayer?.base_price}!`
      );
    } catch (err) {
      console.error("Error declaring winner:", err);
      alert("An error occurred while declaring the winner.");
    }
  };

  const handleBidding = async () => {
    if (!bidAmount || bidAmount <= 0) {
      alert("Please enter a valid bid amount.");
      return;
    }

    const lastBidAmount =
      bids.length > 0
        ? parseInt(
            bids[bids.length - 1].split(": ")[1].split(" ")[0].replace("₹", "")
          )
        : 0;

    const totalBidAmount = selectedPlayer
      ? selectedPlayer?.base_price + bidAmount
      : 0;

    if (totalBidAmount <= lastBidAmount) {
      alert(`Your bid must be higher than ₹${lastBidAmount}.`);
      return;
    }

    if (selectedPlayer) {
      try {
        const { data: currentBuyer, error: fetchError } = await supabase
          .from("buyers")
          .select("*")
          .eq("id", user?.id)
          .single();

        if (fetchError) throw new Error(fetchError.message);

        const totalBidAmount = selectedPlayer.base_price + bidAmount;
        setWinningAmount(bidAmount);

        if (currentBuyer.balance < totalBidAmount) {
          alert("Insufficient balance!");
          return;
        }

        const newBidMessage = `Bid: ₹${totalBidAmount} by ${currentBuyer.name}`;
        const updatedBids = [...bids, newBidMessage];

        await supabase
          .from("players_bid")
          .update({ bids: updatedBids })
          .eq("id", selectedPlayer.id);

        setBids(updatedBids);
        setTimer(15);

        alert("Bid placed successfully!");
      } catch (err) {
        console.error("Failed to place bid:", err);
        alert("An error occurred while placing the bid.");
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center text-2xl mt-32 font-bold text-black">
        Loading...
      </div>
    );
  }

  if (!selectedPlayer) {
    return (
      <div className="text-center text-2xl mt-32 font-bold text-black">
        No Auction is Currently Running.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto p-6 mb-8">
        <div className="bg-black bg-opacity-90 rounded-lg overflow-hidden">
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-white">
              {selectedPlayer
                ? `Auction for Player: ${selectedPlayer.name}`
                : "Waiting for auction to start..."}
            </div>
            {selectedPlayer && (
              <div className="text-lg text-yellow-400">
                Time Remaining: {timer}s
              </div>
            )}
          </div>

          {selectedPlayer && (
            <div className="grid grid-cols-3 gap-0">
              <div className="p-6 border-r border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">
                  Player Details
                </h3>
                <div className="text-white">
                  <div>Name: {selectedPlayer.name}</div>
                  <div>Base Price: ₹{selectedPlayer.base_price}</div>
                  <div>
                    Status: {selectedPlayer.sold ? "Sold" : "Available"}
                  </div>
                  <div>Batting Rating: {selectedPlayer.batting_rating}</div>
                  <div>Bowling Rating: {selectedPlayer.bowling_rating}</div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6">
                <input
                  type="number"
                  placeholder="Enter bid amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="mt-4 p-2 rounded text-black w-full max-w-xs"
                  disabled={selectedPlayer.sold}
                />
                <button
                  onClick={handleBidding}
                  className={`mt-4 px-6 py-2 font-bold rounded w-full max-w-xs
                    ${
                      selectedPlayer.sold
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-yellow-500 hover:bg-yellow-600"
                    } 
                    text-black`}
                  disabled={selectedPlayer.sold}
                >
                  Place Bid
                </button>
              </div>

              <div className="p-6 border-l border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">
                  Bid History
                </h3>
                <div className="max-h-64 overflow-y-auto">
                  <ul className="text-white space-y-2">
                    {bids.map((bid, index) => (
                      <li key={index} className="bg-gray-800 p-2 rounded">
                        {bid}
                      </li>
                    ))}
                  </ul>
                </div>
                {winner && (
                  <div className="mt-4 p-4 bg-yellow-500 text-black rounded-lg font-bold">
                    🏆 {winner.name} won {selectedPlayer.name} for ₹
                    {winningAmount + selectedPlayer.base_price}!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerAuctionPage;
