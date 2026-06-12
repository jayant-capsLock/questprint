import { useEffect, useState } from "react";
import { getGameInfo, getGameImage } from "../data/rawg";

const GameInfoSection = ({ results }) => {
  const [gameDetails, setGameDetails] = useState({});
  const [gameImages, setGameImages] = useState({});

  useEffect(() => {
    async function loadDetails() {
      const details = {};
      const images = {};

      for (const game of results.slice(0, 3)) {
        try {
          details[game.name] = await getGameInfo(game.name);
          images[game.name] = await getGameImage(game.name);
        } catch (err) {
          console.error(err);
        }
      }

      setGameDetails(details);
      setGameImages(images);
    }

    if (results.length > 0) {
      loadDetails();
    }
  }, [results]);

  return (
    <div>
      <h1></h1>
      {results.slice(0, 3).map((game) => (
        <section
          key={game.id}
          id={`game-${game.name}`}
          className="gameInfoSection"
        >
          <img
            className="infoCover"
            src={gameImages[game.name]}
            alt={game.name}
          />
          <h1>{game.name}</h1>
          <div className="bigMatchBadge">{game.match}% Match</div>

          <div className="traitList">
            <p>Challenge: {game.challenge}</p>

            <div className="traitBar">
              <div className="bar">
                <div className="fill" style={{ width: `${game.challenge}%` }} />
              </div>

              <span>{game.challenge}</span>
            </div>

            <p>Exploration: {game.exploration}</p>

            <div className="traitBar">
              <div className="bar">
                <div
                  className="fill"
                  style={{ width: `${game.exploration}%` }}
                />
              </div>

              <span>{game.exploration}</span>
            </div>

            <p>Social: {game.social}</p>

            <div className="traitBar">
              <div className="bar">
                <div className="fill" style={{ width: `${game.social}%` }} />
              </div>

              <span>{game.social}</span>
            </div>

            <p>Creativity: {game.creativity}</p>

            <div className="traitBar">
              <div className="bar">
                <div
                  className="fill"
                  style={{ width: `${game.creativity}%` }}
                />
              </div>

              <span>{game.creativity}</span>
            </div>

            <p>Narrative: {game.narrative}</p>

            <div className="traitBar">
              <div className="bar">
                <div className="fill" style={{ width: `${game.narrative}%` }} />
              </div>

              <span>{game.narrative}</span>
            </div>
          </div>
          <div className="genreContainer">
            {gameDetails[game.name]?.genres?.map((genre) => (
              <span key={genre} className="genreTag">
                {genre}
              </span>
            ))}
          </div>
          <p>Rating: {gameDetails[game.name]?.rating}</p>
          <p>{gameDetails[game.name]?.description?.slice(0, 1500)}...</p>
        </section>
      ))}
    </div>
  );
};

export default GameInfoSection;
