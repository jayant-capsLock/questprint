const API_KEY = "7865a2dbaee944eebf097722f31142c2";

export async function getGameImage(gameName) {
   const cachedImage = localStorage.getItem(`image-${gameName}`);

  if (cachedImage) {
    console.log("Image from cache");
    return cachedImage;
  }

  const response = await fetch(
    `https://api.rawg.io/api/games?search=${encodeURIComponent(
      gameName,
    )}&page_size=1&key=${API_KEY}`,
  );

  if (!response.ok) {
  console.log(
    gameName,
    "failed",
    response.status
  );
  return null;
}

  const data = await response.json();
  if(data.results[0] !== undefined){localStorage.setItem(`image-${gameName}`,data.results?.[0]?.background_image);}
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

export async function searchGames(searchGames) {
   const response = await fetch(
    `https://api.rawg.io/api/games?search=${encodeURIComponent(
      searchGames
    )}&page_size=5&key=${API_KEY}`
  );
  const data = await response.json();

return data.results.sort((a, b) => b.rating - a.rating).slice(0,5);

}
