import React, { useRef, useState } from "react";
import { personalityQuestions } from "./questions";
import { useEffect } from "react";

const QuizBox = () => {
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

  const [screen, setScreen] = useState("welcome");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [answers, setAnswers] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionAnimating, setQuestionAnimating] = useState(false);

  const startQuiz = () => {
    setIsTransitioning(true);

    setTimeout(() => {
      setScreen("question");
      setIsTransitioning(false);
    }, 500);
  };

  useEffect(() => {
    const currentId = personalityQuestions[currentQuestion].id;
    setSliderValue(answers[currentId] ?? 50);
  }, [currentQuestion]);

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
    const current = personalityQuestions[currentQuestion];

    setAnswers((prev) => ({ ...prev, [current.id]: sliderValue }));

    if (currentQuestion < personalityQuestions.length - 1) {
      setQuestionAnimating(true);
      setTimeout(() => {
        setCurrentQuestion((prev) => prev + 1);
        setQuestionAnimating(false);
      }, 500);
    } else {
      console.log("quiz complete");
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

          <button onClick={handleNextQuestion}>Next</button>

          <button onClick={handlePrevQuestion}>Back</button>

          <pre>{JSON.stringify(answers, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default QuizBox;
