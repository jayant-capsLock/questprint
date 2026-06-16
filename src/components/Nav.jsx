import { searchGames, getGameInfo } from "../data/rawg";

const Nav = ({
  setScreen,
  screen,
  setPage,
  user,
  page,
  searchTerm,
  setSearchTerm,
  searchResults,
  setSearchResults,
  setDiscoveryScreen,
}) => {
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    const results = await searchGames(searchTerm);

    const resultsWithDescriptions = await Promise.all(
      results.map(async (game) => {
        const info = await getGameInfo(game.name);

        return {
          ...game,
          description: info?.description,
        };
      }),
    );

    setSearchResults(resultsWithDescriptions);
    if (results.length > 0) {
      setDiscoveryScreen("searchResults");
    }
  };

  return (
    <nav className="nav">
      <div className="logo" onClick={() => setPage("home")}>
        QuestPrint
      </div>

      {page === "discover" && (
        <div className="searchContainer">
          <input
            type="text"
            placeholder="Search games..."
            className="searchInput"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
          />

          <button className="searchButton" onClick={handleSearch}>
            🔍
          </button>
        </div>
      )}

      <div className="navLinks">
        {user && (
          <>
            <button
              className={page === "discover" ? "nav-link active" : "nav-link"}
              onClick={() => setPage("discover")}
            >
              Discover
            </button>

            <button
              className={page === "profile" ? "nav-link active" : "nav-link"}
              onClick={() => setPage("profile")}
            >
              Profile
            </button>
            <button
              className={page === "social" ? "nav-link active" : "nav-link"}
              onClick={() => setPage("social")}
            >
              Social
            </button>
          </>
        )}
      </div>

      <div className="account">
        {!user ? (
          <button
            className="nav-link"
            onClick={() => {
              if (screen === "login" || screen === "signup") {
                setScreen("welcome");
              } else {
                setScreen("login");
              }
            }}
          >
            {screen === "login" || screen === "signup" ? "Home" : "Sign In"}
          </button>
        ) : (
          <button className="nav-link" onClick={() => setPage("profile")}>
            {user.username}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Nav;
