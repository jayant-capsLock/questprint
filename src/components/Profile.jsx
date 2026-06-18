import React, { useEffect, useState } from "react";
import axios from "axios";

const Profile = ({ setPage, user, setUser }) => {
  //const [user, setUser] = useState(null);
  const handleProfileUpload = async (fileToUpload) => {
    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("image", fileToUpload);

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/profile-picture`,
        formData,
        {
          headers: {
            Authorization: token,
          },
        },
      );

      const updatedUser = {
        ...user,
        profilePicture: response.data.profilePicture,
      };

      setUser(updatedUser);

      localStorage.setItem("questprint-user", JSON.stringify(updatedUser));
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/profile`,
          {
            headers: {
              Authorization: token,
            },
          },
        );

        setUser(response.data.user);
        localStorage.setItem(
          "questprint-user",
          JSON.stringify(response.data.user),
        );
      } catch (err) {
        console.log("PROFILE ERROR:");
        console.log(err);
        console.log(err.response);
      }
    };

    fetchProfile();
  }, []);

  if (!user) {
    return (
      <div className="profilePage">
        <div className="profileCard">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  // User exists but has not completed quiz
  if (!user.quizCompleted) {
    return (
      <div className="profilePage">
        <div className="profileCard">
          <h1>No Questprint Yet</h1>

          <p>Complete the personality quiz to generate your gaming profile.</p>

          <button className="homeBtn" onClick={() => setPage("home")}>
            Take Quiz
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("questprint-user");
    localStorage.clear();

    window.location.reload();
  };

  return (
    <div className="profilePage">
      <div className="profileCard">
        <div className="profileHeader">
          <div className="profileBanner"></div>
          <div className="avatarWrapper">
            <div className="avatarCircle">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="profileAvatarImage"
                />
              ) : (
                user.username?.[0]?.toUpperCase()
              )}
            </div>

            <label className="avatarEditBtn">
              ✎
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files[0];

                  if (file) {
                    handleProfileUpload(file);
                  }
                }}
              />
            </label>
          </div>

          <h1>{user.username}</h1>

          <p>{user.email}</p>
        </div>

        <h2>Your Questprint</h2>

        <div className="profileTraits">
          {Object.entries(user.personality || {}).map(([trait, value]) => (
            <div key={trait} className="profileTrait">
              <span className="traitName">{trait}</span>

              <div className="profileBar">
                <div
                  className="profileFill"
                  style={{
                    width: `${value}%`,
                  }}
                />
              </div>

              <span className="traitValue">{value}</span>
            </div>
          ))}
        </div>

        <h2>Top Matches</h2>

        <div className="profileRecommendations">
          {user.recommendations?.slice(0, 3).map((game) => (
            <div key={game.name} className="recommendationCard">
              <h3>{game.name}</h3>
              <p>{game.match}% Match</p>
            </div>
          ))}
        </div>

        <div className="profileButtons">
          <button className="homeBtn" onClick={() => setPage("home")}>
            Home
          </button>

          <button className="logoutBtn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
