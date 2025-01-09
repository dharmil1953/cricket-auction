import React from "react";

const TeamPlayersList: React.FC = () => {
  const players = [
    {
      imageUrl: "https://images.unsplash.com/photo-1562077772-3bd90403f7f0",
      name: "Virat Kohli",
      position: "All-Rounder",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1562077772-3bd90403f7f0",
      name: "Jasprit Bumrah",
      position: "Bowler",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-6">
      <div className="container mx-auto">
        <h2
          className="text-3xl font-bold text-center bg-gradient-to-r from-yellow-400 to-yellow-200 
          bg-clip-text text-transparent mb-12"
        >
          Your Team Roster
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {players.map((player, index) => (
            <div
              key={index}
              className="group bg-black bg-opacity-50 rounded-xl overflow-hidden border border-gray-700 
                hover:border-yellow-500 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative h-64">
                <img
                  src={player.imageUrl}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  {player.name}
                </h3>
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                  <p className="text-gray-300">{player.position}</p>
                </div>

                {/* Additional Stats */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-gray-400">
                      Matches
                      <span className="block text-yellow-500 font-bold">
                        24
                      </span>
                    </div>
                    <div className="text-gray-400">
                      Rating
                      <span className="block text-yellow-500 font-bold">
                        92
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default TeamPlayersList;
