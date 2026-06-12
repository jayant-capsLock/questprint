const API_KEY = "7865a2dbaee944eebf097722f31142c2";

export async function getGameImage(gameName) {
  const response = await fetch(
    `https://api.rawg.io/api/games?search=${encodeURIComponent(
      gameName,
    )}&page_size=1&key=${API_KEY}`,
  );

  const data = await response.json();

  return data.results?.[0]?.background_image;
}

export async function getGameInfo(gameName) {
  const searchResponse = await fetch(
    `https://api.rawg.io/api/games?search=${encodeURIComponent(
      gameName,
    )}&page_size=1&key=${API_KEY}`,
  );

  const searchData = await searchResponse.json();

  const gameId = searchData.results?.[0]?.id;

  if (!gameId) return null;

  const detailsResponse = await fetch(
    `https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`,
  );

  const detailsData = await detailsResponse.json();

  return {
    description: detailsData.description_raw,
    genres: detailsData.genres?.map((genre) => genre.name),
    rating: detailsData.rating,
    released: detailsData.released,
  };
}
