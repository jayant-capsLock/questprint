import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useState } from "react";
import Nav from "./components/Nav.jsx";
import QuizBox from "./components/QuizBox.jsx";
import GameInfoSection from "./components/GameInfoSection";
import Profile from "./components/Profile";
import Discover from "./components/Discover";

const App = () => {
  const token = localStorage.getItem("token");

  const [page, setPage] = useState(token ? "profile" : "home");
  const [results, setResults] = useState([]);
  const [screen, setScreen] = useState("welcome");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("questprint-user")),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [discoveryScreen, setDiscoveryScreen] = useState("default");

  return (
    <>
      {page === "home" && (
        <div className="main">
          <Nav
            setScreen={setScreen}
            screen={screen}
            setPage={setPage}
            user={user}
          />
          <div id="glowLineNav"></div>
          <div className="quizBoxContainer">
            <QuizBox
              results={results}
              setResults={setResults}
              screen={screen}
              setScreen={setScreen}
            />
          </div>
          <GameInfoSection results={results} />
        </div>
      )}
      {page === "discover" && (
        <div>
          <Nav
            setScreen={setScreen}
            screen={screen}
            setPage={setPage}
            user={user}
            page={page}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            discoveryScreen={discoveryScreen}
            setDiscoveryScreen={setDiscoveryScreen}
          />
          <Discover
            results={results}
            setPage={setPage}
            searchTerm={searchTerm}
            searchResults={searchResults}
            discoveryScreen={discoveryScreen}
          />
        </div>
      )}
      {page === "profile" && <Profile setPage={setPage} />}
    </>
  );
};

export default App;
