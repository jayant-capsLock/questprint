import "./styles/social.css";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function Social({ setPage }) {
  const [players, setPlayers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [profileUser, setProfileUser] = useState(null);
  const socketRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("questprint-user"));

  const [onlineUsers, setOnlineUsers] = useState([]);

  const currentUserId = currentUser?._id;

  const [showMenu, setShowMenu] = useState(null);

  const viewProfile = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/social/profile/${userId}`,
        {
          headers: {
            Authorization: token,
          },
        },
      );

      setProfileUser(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    socketRef.current.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socketRef.current.off("online-users");
    };
  }, []);

  useEffect(() => {
    socketRef.current.emit("user-online", currentUser._id);
  }, []);

  const removeFriend = async (friendId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/social/remove-friend/${friendId}`,
        {},
        {
          headers: {
            Authorization: token,
          },
        },
      );

      setFriends((prev) => prev.filter((friend) => friend._id !== friendId));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (!selectedFriend) return;

    const fetchMessages = async () => {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/${selectedFriend._id}`,
        {
          headers: {
            Authorization: token,
          },
        },
      );

      setMessages(data);
    };

    fetchMessages();
  }, [selectedFriend]);

  useEffect(() => {
    const friendsList = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/social/friends`,
          {
            headers: {
              Authorization: token,
            },
          },
        );

        setFriends(response.data);
      } catch (err) {
        console.log(err);
      }
    };
    friendsList();
  }, []);

  const acceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/social/accept/${requestId}`,
        {},
        {
          headers: {
            Authorization: token,
          },
        },
      );

      alert("Friend added!");
      setRequests(requests.filter((request) => request._id !== requestId));
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/social/friends`,
        {
          headers: {
            Authorization: token,
          },
        },
      );

      setFriends(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/social/request/${userId}`,
        {},
        {
          headers: {
            Authorization: token,
          },
        },
      );

      alert("Friend request sent!");
    } catch (err) {
      console.log(err);
    }
  };
  const sendMessage = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/send/${selectedFriend._id}`,
        {
          content: newMessage,
        },
        {
          headers: {
            Authorization: token,
          },
        },
      );

      socketRef.current.emit("send-message", {
        senderId: currentUser._id,
        receiverId: selectedFriend._id,
        content: newMessage,
      });

      setMessages((prev) => [...prev, response.data]);

      setNewMessage("");
    } catch (err) {
      console.log(err);
    }
  };
  const rejectRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/social/reject/${requestId}`,
        {},
        {
          headers: {
            Authorization: token,
          },
        },
      );

      setRequests(requests.filter((request) => request._id !== requestId));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    socketRef.current.on("new-message", (message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          _id: Date.now().toString(),
          createdAt: new Date(),
        },
      ]);
    });

    return () => {
      socketRef.current.off("new-message");
    };
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem("token");

        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/social/recommendations`,
          {
            headers: {
              Authorization: token,
            },
          },
        );
        const { data: requestData } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/social/requests`,
          {
            headers: {
              Authorization: token,
            },
          },
        );

        setRequests(requestData);

        setPlayers(data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="social-page">
      <div className="players-section">
        {!selectedFriend ? (
          <>
            <div className="social-search">
              <button className="back-btn" onClick={() => setPage("home")}>
                ←
              </button>

              <input type="text" placeholder="Search players..." />
            </div>

            <h2>Players Like You</h2>

            <div className="players-list">
              {players.map((player) => (
                <div className="player-card" key={player._id}>
                  <div className="player-left">
                    <div className="player-avatar">{player.username[0]}</div>

                    <div className="player-info">
                      <h3>{player.username}</h3>

                      <div className="traits">
                        <span>Explorer</span>
                        <span>Strategist</span>
                      </div>

                      <p>Loves RPGs, open worlds and deep stories.</p>
                    </div>
                  </div>

                  <div className="player-center">
                    <div className="match-circle">
                      <span>{player.match}%</span>
                      <small>MATCH</small>
                    </div>
                  </div>

                  <div className="player-actions">
                    <button
                      className="view-btn"
                      onClick={() => viewProfile(player._id)}
                    >
                      View Profile
                    </button>

                    <button
                      className="add-btn"
                      onClick={() => sendFriendRequest(player._id)}
                    >
                      Add Friend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="chat-view">
            <div className="chat-header">
              <button
                className="chat-back"
                onClick={() => setSelectedFriend(null)}
              >
                ←
              </button>

              <div className="chat-user">
                <div className="player-avatar">
                  {selectedFriend.username[0]}
                </div>

                <div>
                  <h3>{selectedFriend.username}</h3>
                  <span>
                    {onlineUsers.includes(selectedFriend._id)
                      ? "🟢 Online"
                      : "⚫ Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => {
                return (
                  <div
                    key={msg._id}
                    className={
                      msg.sender === currentUserId
                        ? "message sent"
                        : "message received"
                    }
                  >
                    <div>{msg.content}</div>

                    <div className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <input
                placeholder="Message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
              />

              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        )}
      </div>

      <div className="community-section">
        <div className="friends-panel">
          <h3>Your Friends</h3>

          {friends.map((friend) => (
            <div className="friend-item" key={friend._id}>
              <span>{friend.username}</span>

              <button
                onClick={() =>
                  setShowMenu(showMenu === friend._id ? null : friend._id)
                }
              >
                ⋮
              </button>

              {showMenu === friend._id && (
                <div className="friend-popup">
                  <h4>Message</h4>

                  <div
                    className="friend-popup-user"
                    onClick={() => {
                      setSelectedFriend(friend);
                      setShowMenu(null);
                    }}
                  >
                    <div className="popup-avatar">{friend.username[0]}</div>

                    <span>{friend.username}</span>
                  </div>

                  <button
                    className="remove-friend-btn"
                    onClick={() => removeFriend(friend._id)}
                  >
                    Remove Friend
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="requests-panel">
          <h3>Pending Requests</h3>

          {requests.map((request) => (
            <div className="request-item" key={request._id}>
              <span>{request.sender.username}</span>

              <div>
                <button onClick={() => acceptRequest(request._id)}>✓</button>

                <button onClick={() => rejectRequest(request._id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {profileUser && (
  <div
    className="profile-overlay"
    onClick={() => setProfileUser(null)}
  >
    <div
      className="profile-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="close-profile"
        onClick={() => setProfileUser(null)}
      >
        ✕
      </button>

      <div className="profile-top">
        <div className="profile-avatar">
          {profileUser.username[0]}
        </div>

        <h2>{profileUser.username}</h2>

        <p>QuestPrint Explorer</p>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span>Friends</span>
          <strong>
            {profileUser.friends?.length || 0}
          </strong>
        </div>

        <div className="profile-stat">
          <span>Games</span>
          <strong>
            {profileUser.recommendations?.length || 0}
          </strong>
        </div>

        <div className="profile-stat">
          <span>Status</span>
          <strong>Active</strong>
        </div>
      </div>

      <div className="profile-section">
        <h3>QuestPrint Personality</h3>

        <div className="personality-grid">
          {Object.entries(
            profileUser.personality || {}
          ).map(([trait, value]) => (
            <div
              className="trait-card"
              key={trait}
            >
              <div className="trait-header">
                <span>{trait}</span>

                <strong>
                  {Math.round(value)}%
                </strong>
              </div>

              <div className="trait-bar">
                <div
                  className="trait-fill"
                  style={{
                    width: `${value}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-section">
        <h3>Recommended Games</h3>

        <div className="profile-games">
          {profileUser.recommendations?.map(
            (game, index) => (
              <div
                className="profile-game"
                key={index}
              >
                {game.name}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
