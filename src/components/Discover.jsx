import React, { useEffect, useState } from "react";
import { getGameImage, getGameInfo } from "../data/rawg";

const Discover = ({ results }) => {
  const [gameImages, setGameImages] = useState({});
  const [gameDetails, setGameDetails] = useState({});
  const featuredGame = results[0];
  const explorationGames = results.filter((game) => game.exploration >= 70);

  const narrativeGames = results.filter((game) => game.narrative >= 70);

  const challengeGames = results.filter((game) => game.challenge >= 70);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    async function loadImages() {
      const imageEntries = await Promise.all(
        results.map(async (game) => {
          try {
            const image = await getGameImage(game.name);
            return [game.name, image];
          } catch (err) {
            console.error(err);
            return [game.name, null];
          }
        }),
      );

      setGameImages(Object.fromEntries(imageEntries));
    }

    if (results.length > 0) {
      loadImages();
    }
  }, [results]);
  if (!results.length) {
    return <h1>Loading...</h1>;
  }

  const handleGameClick = async (game) => {
    console.log(window.scrollY);
    setSelectedGame(game);

    if (!gameDetails[game.name]) {
      try {
        const info = await getGameInfo(game.name);

        setGameDetails((prev) => ({
          ...prev,
          [game.name]: info,
        }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const GameRow = ({ title, games }) => (
    <section className="discoverSection">
      <h2>{title}</h2>

      <div className="gameRow">
        {games.map((game) => (
          <React.Fragment key={game.name}>
            <div
              className={`discoverCard ${
                selectedGame?.name === game.name ? "selected" : ""
              }`}
              onClick={() => handleGameClick(game)}
            >
              <img
                src={gameImages[game.name]}
                alt={game.name}
                className="discoverImage"
              />

              <div className="discoverOverlay">
                <h3>{game.name}</h3>
                <p>{game.match}% Match</p>
              </div>
            </div>

            {selectedGame?.name === game.name && (
              <div className="expandedGamePanel">
                <h2>{game.name}</h2>

                <p
                  style={{
                    color: "#ff69c8",
                    fontWeight: "bold",
                    marginTop: "0.5rem",
                  }}
                >
                  {game.match}% Match
                </p>
                <div className="genreContainer">
                  {gameDetails[game.name]?.genres?.map((genre) => (
                    <span key={genre} className="genreTag">
                      {genre}
                    </span>
                  ))}
                </div>
                <p>⭐ {gameDetails[game.name]?.rating}</p>
                <p
                  style={{
                    marginTop: "1rem",
                    opacity: 0.8,
                    lineHeight: "1.6",
                  }}
                >
                  {gameDetails[game.name]?.description?.slice(0, 300) ||
                    "Loading description..."}
                </p>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
  console.log(selectedGame);
  return (
    <div className="discoverPage">
      <h1>Discover</h1>
      <p>Find your next obsession.</p>

      <div
        className="featuredHero"
        style={{
          backgroundImage: `url(${gameImages[featuredGame.name]})`,
        }}
      >
        <div className="featuredOverlay">
          <span className="featuredBadge">🎯 Best Match</span>

          <h1>{featuredGame.name}</h1>

          <p>{featuredGame.match}% Match</p>

          <button className="featuredBtn">Learn More</button>
        </div>
      </div>

      <section className="discoverSection">
        <GameRow title="🔥 Recommended For You" games={results.slice(1)} />

        <GameRow title="🌍 Exploration Games" games={explorationGames} />

        <GameRow title="📖 Story Rich" games={narrativeGames} />

        <GameRow title="⚔️ Challenge Seekers" games={challengeGames} />
      </section>
    </div>
  );
};

export default Discover;
