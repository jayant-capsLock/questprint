
import React, { useEffect, useState } from "react";
import axios from "axios";


const Profile = ({ setPage }) => {
  const [user, setUser] = useState(null);
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
        }
      );

      setUser(response.data.user);
    } catch (err) {
      console.log(err);
    }
  };

  fetchProfile();
}, []);

  if (!user) {
    return (
      <div className="profilePage">
        <div className="profileCard">
          <h1>Loading...</h1>

          <button className="homeBtn" onClick={() => setPage("home")}>
            Home
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("questprint-user");

    window.location.reload();
  };

  return (
    <div className="profilePage">
      <div className="profileCard">
        <div className="profileHeader">
          <div className="avatarCircle">
            {user.username?.[0]?.toUpperCase()}
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
