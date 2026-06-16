import React, { useEffect, useState, useRef } from "react";
import { getGameImage, getGameInfo } from "../data/rawg";

const Discover = ({ results, setPage, discoveryScreen, searchResults }) => {
  const [gameImages, setGameImages] = useState({});
  const [gameDetails, setGameDetails] = useState({});
  const featuredGame = results[0];
  const explorationGames = results.filter((game) => game.exploration >= 70);

  const narrativeGames = results.filter((game) => game.narrative >= 70);

  const challengeGames = results.filter((game) => game.challenge >= 70);

  const [visibleRecommended, setVisibleRecommended] = useState(10);
  const [visibleExploration, setVisibleExploration] = useState(10);
  const [visibleNarrative, setVisibleNarrative] = useState(10);
  const [visibleChallenge, setVisibleChallenge] = useState(10);

  useEffect(() => {
    async function loadHero() {
      try {
        const heroImage = await getGameImage(featuredGame.name);

        setGameImages({
          [featuredGame.name]: heroImage,
        });
      } catch (err) {
        console.error(err);
      }
    }

    if (featuredGame) {
      loadHero();
    }
  }, [featuredGame]);

  const visibleGamesToLoad = [
    ...results.slice(1, visibleRecommended),
    ...explorationGames.slice(0, visibleExploration),
    ...narrativeGames.slice(0, visibleNarrative),
    ...challengeGames.slice(0, visibleChallenge),
  ];

  useEffect(() => {
    async function loadImages() {
      for (const game of visibleGamesToLoad) {
        if (gameImages[game.name]) continue;

        try {
          const image = await getGameImage(game.name);

          setGameImages((prev) => ({
            ...prev,
            [game.name]: image,
          }));
        } catch (err) {
          console.error("Failed:", game.name, err);

          setGameImages((prev) => ({
            ...prev,
            [game.name]: null,
          }));
        }
      }
    }

    if (results.length > 0) {
      loadImages();
    }
  }, [
    results,
    visibleRecommended,
    visibleExploration,
    visibleNarrative,
    visibleChallenge,
  ]);

  if (!results.length) {
    return <h1>Loading...</h1>;
  }

  return (
    <>
      {discoveryScreen === "default" && (
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
            <GameRow
              title="🔥 Recommended For You"
              games={results.slice(1, visibleRecommended)}
              loadMore={setVisibleRecommended}
              gameImages={gameImages}
              gameDetails={gameDetails}
              setGameDetails={setGameDetails}
            />

            <GameRow
              title="🌍 Exploration Games"
              games={explorationGames.slice(0, visibleExploration)}
              loadMore={setVisibleExploration}
              gameImages={gameImages}
              gameDetails={gameDetails}
              setGameDetails={setGameDetails}
            />

            <GameRow
              title="📖 Story Rich"
              games={narrativeGames.slice(0, visibleNarrative)}
              loadMore={setVisibleNarrative}
              gameImages={gameImages}
              gameDetails={gameDetails}
              setGameDetails={setGameDetails}
            />

            <GameRow
              title="⚔️ Challenge Seekers"
              games={challengeGames.slice(0, visibleChallenge)}
              loadMore={setVisibleChallenge}
              gameImages={gameImages}
              gameDetails={gameDetails}
              setGameDetails={setGameDetails}
            />
          </section>
        </div>
      )}
      {discoveryScreen === "searchResults" && (
        <div className="searchResultsList">
          {searchResults.map((game) => (
            <div key={game.id} className="searchCard">
              <img src={game.background_image} alt={game.name} />

              <div className="searchCardContent">
                <h2>{game.name}</h2>

                <div className="searchMeta">
                  <span>⭐ {game.rating}</span>
                  <span>{game.released}</span>
                </div>

                <p className="searchDescription">
                  {game.description.slice(0, 400)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const GameRow = ({
  title,
  games,
  loadMore,
  gameImages,
  gameDetails,
  setGameDetails,
}) => {
  const canMove = useRef(false);
  const timeoutRef = useRef(null);
  const rowRef = useRef(null);
  const scrollPosition = useRef(0);
  const [selectedGame, setSelectedGame] = useState(null);
  const loadingMore = useRef(false);

  const handleMouseEnter = (e) => {
    const box = e.currentTarget;

    canMove.current = false;

    box.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";

    box.style.transform = `
    perspective(1000px)
    translateY(-10px)
  `;

    

    timeoutRef.current = setTimeout(() => {
      canMove.current = true;
      box.style.transition =
        "transform 0.15s ease-out, box-shadow 0.15s ease-out";
    }, 200);
  };

  const handleMouseMove = (e) => {
    if (!canMove.current) return;

    const box = e.currentTarget;
    const rect = box.getBoundingClientRect();

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;


    const rotateX = y / 100;
    const rotateY = -x / 100;

    box.style.transform = `
    perspective(1000px)
    translateY(${y / 100}px)
    translateX(${x / 30}px)
    rotateX(${rotateX}deg)
    rotateY(${rotateY}deg)
  `;
  };

  const handleMouseLeave = (e) => {
    clearTimeout(timeoutRef.current);

    canMove.current = false;

    e.currentTarget.style.transition =
      "transform 0.2s ease, box-shadow 0.2s ease";

    e.currentTarget.style.transform = `
    perspective(1000px)
    rotateX(0deg)
    rotateY(0deg)
    translateY(0px)
  `;

    e.currentTarget.style.boxShadow = "none";
  };

  const handleGameClick = async (game) => {
    
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

  useEffect(() => {
    const row = rowRef.current;

    if (!row) return;

    const handleWheel = (e) => {
      e.preventDefault();
      row.scrollLeft += 6 * e.deltaY;
    };

    const handleScroll = () => {
      scrollPosition.current = row.scrollLeft;
      if (
        !loadingMore.current &&
        row.scrollLeft + row.clientWidth >= row.scrollWidth - 300
      ) {
        loadingMore.current = true;
        loadMore((prev) => prev + 10);

        setTimeout(() => {
          loadingMore.current = false;
        }, 500);
      }
    };

    row.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    row.addEventListener("scroll", handleScroll);

    return () => {
      row.removeEventListener("wheel", handleWheel);
      row.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (rowRef.current) {
      rowRef.current.scrollLeft = scrollPosition.current;
    }
  }, [games.length]);

  return (
    <section className="discoverSection">
      <h2>{title}</h2>
      <div className="gameRowWrapper ">
        <div className="gameRow " ref={rowRef} data-lenis-prevent>
          {games.map((game) => {
            return (
              <React.Fragment key={game.name}>
                <div
                  className={`discoverCard ${
                    selectedGame?.name === game.name ? "selected" : ""
                  }`}
                  onClick={() => handleGameClick(game)}
                  onMouseEnter={handleMouseEnter}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={gameImages[game.name]}
                    alt={game.name}
                    className="discoverImage"
                    onError={() =>
                      console.log("BROKEN:", game.name, gameImages[game.name])
                    }
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
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Discover;
