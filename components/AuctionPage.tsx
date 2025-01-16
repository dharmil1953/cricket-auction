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

type RealtimeChannelStatus =
  | "SUBSCRIBED"
  | "CLOSED"
  | "TIMED_OUT"
  | "CHANNEL_ERROR";

interface WinnerPayload {
  winner: {
    id: number;
    name: string;
    balance: number;
  };
  player: {
    id: number;
    name: string;
    base_price: number;
    image_url: string;
    batting_rating: number;
    bowling_rating: number;
    status: string;
    team_id: number;
    sold: boolean;
    isBiddingRunning: boolean;
  };
  amount: number;
}

const BuyerAuctionPage = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(15);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [bids, setBids] = useState<string[]>([]);
  const [winner, setWinner] = useState<Buyer | null>(null);
  const [winningAmount, setWinningAmount] = useState<number>(0);
  const [isWinnerDeclared, setIsWinnerDeclared] = useState<boolean>(false);
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

  // Add new effect for winner announcements
  useEffect(() => {
    if (!selectedPlayer?.id) return;

    const winnerChannel = supabase.channel(
      `winner_announcement:${selectedPlayer.id}`
    );
    winnerChannel
      .on(
        "broadcast",
        { event: "winner_declared" },
        ({ payload }: { payload: WinnerPayload }) => {
          if (!isWinnerDeclared) {
            const { winner: declaredWinner, player, amount } = payload;
            setWinner(declaredWinner);
            setWinningAmount(amount - (player?.base_price || 0));
            alert(
              `${declaredWinner.name} has won the auction for ${player.name} at ₹${amount}!`
            );
            setIsWinnerDeclared(true);
          }
        }
      )
      .subscribe();

    return () => {
      winnerChannel.unsubscribe();
    };
  }, [selectedPlayer?.id, isWinnerDeclared, supabase]);

  const declareWinner = async () => {
    if (!selectedPlayer || bids.length === 0) return;

    const lastBidMessage = bids[bids.length - 1];

    const bidParts = lastBidMessage.split(" by ");
    const winnerName = bidParts[1];
    const finalAmount = parseInt(bidParts[0].split("₹")[1]);

    try {
      const { data: winnerData, error: winnerError } = await supabase
        .from("buyers")
        .select("*")
        .eq("name", winnerName)
        .single();

      if (winnerError) throw new Error(winnerError.message);

      const winningBuyer = winnerData as Buyer;

      const updatedBalance = winningBuyer.balance - finalAmount;

      const updatedTeamList = winnerData?.team_list || [];
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
          team_id: winningBuyer.id,
        })
        .eq("id", selectedPlayer.id);

      await supabase
        .from("players_bid")
        .update({
          buyer_id: winningBuyer.id,
          total_bid_amount: finalAmount,
        })
        .eq("id", selectedPlayer.id);

      setWinner(winningBuyer);
      setWinningAmount(finalAmount - selectedPlayer.base_price);

      const winnerChannel = supabase.channel(
        `winner_announcement:${selectedPlayer.id}`
      );
      winnerChannel.subscribe(async (status: RealtimeChannelStatus) => {
        if (status === "SUBSCRIBED") {
          await winnerChannel.send({
            type: "broadcast",
            event: "winner_declared",
            payload: {
              winner: winningBuyer,
              player: selectedPlayer,
              amount: finalAmount,
            },
          });
          winnerChannel.unsubscribe();
        }
      });

      setIsWinnerDeclared(true);
    } catch (err) {
      console.error("Error declaring winner:", err);
      alert("An error occurred while declaring the winner.");
    }
  };

  useEffect(() => {
    setIsWinnerDeclared(false);
  }, [selectedPlayer?.id]);

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
  console.log("bids", bids);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto p-6 mb-8">
        <div className="bg-black bg-opacity-90 rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-white">
              {selectedPlayer
                ? `Auction for Player: ${selectedPlayer.name}`
                : "Waiting for auction to start..."}
            </div>
            {selectedPlayer && (
              <>
                <div className="text-lg text-yellow-400">
                  Time Remaining: {timer}s
                </div>
                {!user && (
                  <div className="mt-2 text-gray-400 text-sm">
                    👀 Viewing as spectator - Login to participate in bidding
                  </div>
                )}
              </>
            )}
          </div>

          {selectedPlayer && (
            <div className="grid grid-cols-3 gap-0">
              {/* Player Details Section */}
              <div className="p-6 border-r border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">
                  Player Details
                </h3>
                <div className="text-white space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Name:</span>
                    {selectedPlayer.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Base Price:</span>₹
                    {selectedPlayer.base_price.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Status:</span>
                    <span
                      className={
                        selectedPlayer.sold ? "text-red-400" : "text-green-400"
                      }
                    >
                      {selectedPlayer.sold ? "Sold" : "Available"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Batting Rating:</span>
                    {selectedPlayer.batting_rating}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Bowling Rating:</span>
                    {selectedPlayer.bowling_rating}
                  </div>
                </div>
              </div>

              {/* Bidding Section */}
              <div className="p-6 flex flex-col items-center justify-center">
                {user ? (
                  !selectedPlayer.sold ? (
                    <>
                      <div className="w-full max-w-xs space-y-4">
                        <input
                          type="number"
                          placeholder="Enter bid amount"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Number(e.target.value))}
                          className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-yellow-500 focus:outline-none"
                        />
                        <button
                          onClick={handleBidding}
                          className="w-full p-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded transition-colors"
                        >
                          Place Bid
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-yellow-400 font-semibold text-center">
                      This auction has ended
                    </div>
                  )
                ) : (
                  <div className="text-center space-y-3">
                    <div className="text-gray-400">
                      You are in view-only mode
                    </div>
                    <div className="text-white">
                      Login to participate in the auction
                    </div>
                  </div>
                )}
              </div>

              {/* Bid History Section */}
              <div className="p-6 border-l border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">
                  Live Bid History
                </h3>
                <div className="max-h-64 overflow-y-auto">
                  {bids.length > 0 ? (
                    <ul className="text-white space-y-2">
                      {bids.map((bid, index) => (
                        <li
                          key={index}
                          className="bg-gray-800 p-3 rounded animate-fade-in"
                        >
                          {bid}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400 text-center">
                      No bids placed yet
                    </div>
                  )}
                </div>
                {winner && (
                  <div className="mt-4 p-4 bg-yellow-500 text-black rounded-lg font-bold animate-bounce">
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
