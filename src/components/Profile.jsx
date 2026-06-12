import React from "react";

const Profile = ({ setPage }) => {
  const user = JSON.parse(localStorage.getItem("questprint-user"));

  if (!user) {
    return (
      <div className="profilePage">
        <div className="profileCard">
          <h1>No Profile Found</h1>

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
          {Object.entries(user.profile || {}).map(([trait, value]) => (
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
