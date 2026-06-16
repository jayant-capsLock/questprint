import React, { useRef, useState } from "react";
import { personalityQuestions } from "./questions";
import { useEffect } from "react";
import { games } from "../data/games.js";
import { calculateMatch } from "./matchingEngine.js";
import { getGameImage } from "../data/rawg.js";
import axios from "axios";

const QuizBox = ({ results, setResults, screen, setScreen }) => {
  const canMove = useRef(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = (e) => {
    const box = e.currentTarget;

    // reset movement
    canMove.current = false;

    // smooth glow-in effect
    box.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";

    const rect = box.getBoundingClientRect();

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateX = y / 100;
    const rotateY = -x / 100;

    box.style.transform = `
    perspective(1000px)
    
    translateY(-10px)
    `;

    box.style.boxShadow = `
      0px 0px 10px #ff006e,
      0px 0px 20px #ff006e,
      0px 0px 40px #ff006e
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

    box.style.boxShadow = `
      ${x / 20}px ${y / 20}px 10px #f72585,
      ${x / 20}px ${y / 20}px 20px #f72585,
      ${x / 20}px ${y / 20}px 40px #f72585
    `;

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

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [answers, setAnswers] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionAnimating, setQuestionAnimating] = useState(false);

  const [gameImages, setGameImages] = useState({});
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [personality, setPersonality] = useState({});
  const [questprintSaved, setQuestprintSaved] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("questprint-user"));

    if (user?.quizCompleted) {
      setQuestprintSaved(true);
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("questprint-user"));

    if (user?.quizCompleted) {
      const recommendations = games
        .map((game) => ({
          ...game,
          match: calculateMatch(user.personality, game),
        }))
        .sort((a, b) => b.match - a.match);

      setResults(recommendations);
      setPersonality(user.personality || {});
      setQuestprintSaved(true);
      setScreen("results");
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/login`,
        {
          email: loginEmail,
          password: loginPassword,
        },
      );

      localStorage.setItem("token", response.data.token);

      const questprintData = localStorage.getItem("questprint-data");

      if (questprintData) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/save-questprint`,
          JSON.parse(questprintData),
          {
            headers: {
              Authorization: response.data.token,
            },
          },
        );
      }

      localStorage.setItem(
        "questprint-user",
        JSON.stringify(response.data.user),
      );

      alert("Login successful!");

      window.location.reload();
    } catch (err) {
      console.log(err);

      alert(err.response?.data?.message || "Login failed");
    }
  };

  const handleCreateAccount = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/register`, {
        username,
        email,
        password,
      });

      setScreen("login");
    } catch (err) {
      console.log(err);
      console.log(err.response);

      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed",
      );
    }
  };

  const startQuiz = () => {
    setIsTransitioning(true);

    setTimeout(() => {
      setScreen("question");
      setIsTransitioning(false);
    }, 500);
  };

  useEffect(() => {
    const saved = localStorage.getItem("questprintSaved");

    if (saved === "true") {
      setQuestprintSaved(true);
    }
  }, []);

  useEffect(() => {
    const currentId = personalityQuestions[currentQuestion].id;
    setSliderValue(answers[currentId] ?? 50);
  }, [currentQuestion]);

  useEffect(() => {
    async function loadImages() {
      const images = {};

      for (const game of results.slice(0, 3)) {
        try {
          images[game.name] = await getGameImage(game.name);
        } catch (err) {
          console.error(err);
        }
      }

      setGameImages(images);
    }

    if (screen === "results" && results.length > 0) {
      loadImages();
    }
  }, [screen, results]);

  const handleNextQuestion = () => {
    const current = personalityQuestions[currentQuestion];

    setAnswers((prev) => ({
      ...prev,
      [current.id]: sliderValue,
    }));

    if (currentQuestion < personalityQuestions.length - 1) {
      setQuestionAnimating(true);
      setTimeout(() => {
        setCurrentQuestion((prev) => prev + 1);
        setQuestionAnimating(false);
      }, 500);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setQuestionAnimating(true);
      setTimeout(() => {
        setCurrentQuestion((prev) => prev - 1);
        setQuestionAnimating(false);
      }, 500);
    }
  };

  const saveCurrentAnswer = () => {
    console.log("saveCurrentAnswer");
    console.log("currentQuestion:", currentQuestion);
    const current = personalityQuestions[currentQuestion];

    setAnswers((prev) => ({ ...prev, [current.id]: sliderValue }));

    if (currentQuestion < personalityQuestions.length - 1) {
      setQuestionAnimating(true);
      setTimeout(() => {
        setCurrentQuestion((prev) => prev + 1);
        setQuestionAnimating(false);
      }, 500);
    } else {
      console.log("LAST QUESTION REACHED");
      // Quiz is complete - save everything to localStorage
      const finalAnswers = {
        ...answers,
        [current.id]: sliderValue,
      };

      setPersonality(finalAnswers);

      const recommendations = games
        .map((game) => ({
          ...game,
          match: calculateMatch(finalAnswers, game),
        }))
        .sort((a, b) => b.match - a.match);

      localStorage.setItem(
        "questprint-data",
        JSON.stringify({
          personality: finalAnswers,
          recommendations,
        }),
      );

      setResults(recommendations);
      setScreen("results");
    }
  };

  const handleSaveQuestprint = async () => {
    try {
      const token = localStorage.getItem("token");

      // Validate token exists
      if (!token) {
        alert("Please log in first");
        setScreen("login");
        return;
      }

      // Get questprint data from localStorage
      const questprintData = localStorage.getItem("questprint-data");

      if (!questprintData) {
        alert("No questprint data found. Please complete the quiz first.");
        return;
      }

      const questprint = JSON.parse(questprintData);

      console.log("Saving questprint:", questprint);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/save-questprint`,
        questprint,
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Save response:", response.data);

      alert("Questprint saved successfully!");

      localStorage.setItem("questprintSaved", "true");
      setQuestprintSaved(true);

      // Redirect to success screen
      setScreen("accountCreated");
    } catch (err) {
      console.error("Save Questprint Error:", err);

      // Log detailed error info
      if (err.response) {
        console.error("Backend error:", err.response.status, err.response.data);
        alert(err.response?.data?.message || "Failed to save Questprint");
      } else if (err.request) {
        console.error("No response from server:", err.request);
        alert("No response from server. Check if backend is running.");
      } else {
        console.error("Error:", err.message);
        alert(err.message);
      }
    }
  };

  return (
    <div
      className="QuizBox"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {screen === "welcome" && (
        <div
          className={`welcomeMessage ${isTransitioning ? "slideOutLeft" : ""}`}
          onClick={startQuiz}
        >
          <h1 className="discoverPhrase">Discover Your Gaming Personality</h1>
          <h3 className="intro">
            Then I'll match you with games that fit who you are — not just what
            genre you play
          </h3>
          <p className="prompt">Click To Continue</p>
        </div>
      )}
      {screen === "question" && (
        <div
          className={`questionScreen ${questionAnimating ? "slideOutLeft" : ""}`}
        >
          <div className="progressBar">
            <div
              className="progressFill"
              style={{
                width: `${
                  ((currentQuestion + 1) / personalityQuestions.length) * 100
                }%`,
              }}
            />
          </div>
          <h1 className="questionText">
            {personalityQuestions[currentQuestion].question}
          </h1>
          <input
            className="silder"
            type="range"
            min={0}
            max={100}
            value={sliderValue}
            onChange={(e) => {
              setSliderValue(Number(e.target.value));
            }}
            onMouseUp={saveCurrentAnswer}
            onTouchEnd={saveCurrentAnswer}
          />
          <div className="sliderLabels">
            <span>{personalityQuestions[currentQuestion].leftLabel}</span>
            <p>{sliderValue}</p>
            <span>{personalityQuestions[currentQuestion].rightLabel}</span>
          </div>
          <div id="buttons">
            <button onClick={handlePrevQuestion}>Back</button>

            <button
              onClick={handleNextQuestion}
              disabled={currentQuestion === personalityQuestions.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      )}
      {screen === "results" && (
        <div className="resultsScreen">
          <h1>Your Matches</h1>
          <div className="resultsGrid">
            {results.slice(0, 3).map((game) => (
              <div
                className="resultGames"
                key={game.id}
                onClick={() => {
                  document.getElementById(`game-${game.name}`)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                style={{
                  backgroundImage: `url(${gameImages[game.name]})`,
                }}
              >
                <div className="cardOverlay">
                  <div className="matchBadge">{game.match}%</div>

                  <h2>{game.name}</h2>
                </div>
              </div>
            ))}
          </div>
          {questprintSaved ? (
            <div className="savedBadge">✓ QuestPrint Saved</div>
          ) : (
            <button
              className="saveQuestprintBtn"
              onClick={() => {
                const token = localStorage.getItem("token");

                if (token) {
                  handleSaveQuestprint();
                } else {
                  setScreen("signup");
                }
              }}
            >
              <div>
                <h2>Save</h2>
                <p>Your Questprint</p>
              </div>
            </button>
          )}
        </div>
      )}
      {screen === "signup" && (
        <div className="signupScreen">
          <h1>Create Account</h1>
          <div className="signupForm">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleCreateAccount}>Create Account</button>

            <p className="switchAuth">
              Already have an account?{" "}
              <span className="authLink" onClick={() => setScreen("login")}>
                Sign In
              </span>
            </p>
          </div>
        </div>
      )}
      {screen === "login" && (
        <div className="signupScreen">
          <h1>Sign In</h1>

          <div className="signupForm">
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />

            <button onClick={handleLogin}>Sign In</button>

            <p className="switchAuth">
              Don't have an account?{" "}
              <span className="authLink" onClick={() => setScreen("signup")}>
                Create Account
              </span>
            </p>
          </div>
        </div>
      )}
      {screen === "accountCreated" && (
        <div className="accountCreated">
          <h1>Account Created</h1>

          <p>Your Questprint has been saved.</p>

          <button onClick={() => setScreen("results")}>
            View Recommendations
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizBox;
