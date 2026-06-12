const Nav = ({ setScreen, screen, setPage, user }) => {
  return (
    <div className="nav">
      <a className="nav-link" href="/">
        Free Games
      </a>
      <a className="nav-link" href="/List">
        List
      </a>
      <a className="nav-link" href="/Settings">
        Settings
      </a>
      {!user ? (
        <button
          className="nav-link navButton"
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
        <button
          className="nav-link navButton"
          onClick={() => setPage("profile")}
        >
          {user.username}
        </button>
      )}
    </div>
  );
};

export default Nav;
