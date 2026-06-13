const Nav = ({ setScreen, screen, setPage, user }) => {
  return (
    <nav className="nav">
      <div className="logo" onClick={() => setPage("home")}>
        QuestPrint
      </div>

      <div className="navLinks">
        {user && (
          <>
            <button className="nav-link" onClick={() => setPage("discover")}>
              Discover
            </button>

            <button className="nav-link" onClick={() => setPage("profile")}>
              Profile
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
