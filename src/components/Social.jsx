import "./styles/social.css";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import LiveKitCall from "./LiveKitCall";
import ScreenShareView from "./ScreenShareView";

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

  const messageSoundRef = useRef(null);
  const [socialSearch, setSocialSearch] = useState("");
  const [filteredSocialSearch, setFilteredSocialSearch] = useState("");
  const [socialSearchResults, setSocialSearchResults] = useState([]);

  const [incomingCall, setIncomingCall] = useState(null);

  const ringtoneRef = useRef(null);

  const [liveKitRoom, setLiveKitRoom] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const roomRef = useRef(null);

  const [friendStreaming, setFriendStreaming] = useState(false);
  const [showStream, setShowStream] = useState(true);

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

  // ============================================================
  // USEEFFECTS - PROPER ORDER
  // ============================================================

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on("connect", () => {
      socketRef.current.emit("user-online", currentUser._id);
    });

    return () => {
      socketRef.current.off("connect");
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socketRef.current.off("online-users");
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.off("new-message");

    socketRef.current.on("new-message", (message) => {
      const isCurrentChat =
        selectedFriend &&
        (selectedFriend._id === message.sender ||
          selectedFriend._id === message.receiver);

      if (!isCurrentChat) {
        messageSoundRef.current?.play().catch(() => {});
      }

      if (isCurrentChat) {
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            _id: Date.now().toString(),
            createdAt: new Date(),
          },
        ]);
      }
    });

    return () => {
      socketRef.current.off("new-message");
    };
  }, [selectedFriend]);

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on("incoming-call", (data) => {
      setIncomingCall(data);

      ringtoneRef.current?.play().catch(() => {});
    });

    return () => {
      socketRef.current.off("incoming-call");
    };
  }, []);

  useEffect(() => {
    ringtoneRef.current = new Audio("/ringtone.mp3");
    ringtoneRef.current.loop = true;
  }, []);

  useEffect(() => {
    messageSoundRef.current = new Audio("/notification.mp3");
  }, []);

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
    if (!socketRef.current) return;

    socketRef.current.on("call-accepted", ({ roomName }) => {
      setLiveKitRoom(roomName);
    });

    return () => {
      socketRef.current.off("call-accepted");
    };
  }, []);

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

  const filterSearch = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/social/search/${socialSearch}`,
        {
          headers: {
            Authorization: token,
          },
        },
      );

      setSocialSearchResults(data);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredPlayers = players.filter((player) =>
    player.username.toLowerCase().includes(filteredSocialSearch.toLowerCase()),
  );

  useEffect(() => {
    if (socialSearch === "") {
      setFilteredSocialSearch(socialSearch);
    }
  }, [socialSearch]);

  const displayedPlayers =
    filteredSocialSearch === "" ? players : socialSearchResults;

  const createRoomName = (friendId) => {
    return [currentUser._id, friendId].sort().join("-");
  };

  return (
    <div className="social-page">
      <div className="players-section">
        {!selectedFriend ? (
          <>
            <div className="social-search">
              <button className="back-btn" onClick={() => setPage("home")}>
                ←
              </button>

              <input
                type="text"
                placeholder="Search players..."
                value={socialSearch}
                onChange={(e) => {
                  setSocialSearch(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setFilteredSocialSearch(socialSearch);
                    filterSearch();
                  }
                }}
              />
            </div>

            <h2>Players Like You</h2>

            <div className="players-list">
              {displayedPlayers.map((player) => (
                <div className="player-card" key={player._id}>
                  <div className="player-left">
                    <div className="player-avatar">
                      {player.profilePicture ? (
                        <img
                          src={player.profilePicture}
                          alt={player.username}
                          className="social-avatar-img"
                        />
                      ) : (
                        player.username[0]
                      )}
                    </div>

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
                  {selectedFriend.profilePicture ? (
                    <img
                      src={selectedFriend.profilePicture}
                      alt={selectedFriend.username}
                      className="social-avatar-img"
                    />
                  ) : (
                    selectedFriend.username[0]
                  )}
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
              {!liveKitRoom ? (
                <button
                  className="voice-btn"
                  onClick={() => {
                    if (!selectedFriend) return;

                    const roomName = createRoomName(selectedFriend._id);

                    socketRef.current.emit("call-user", {
                      targetUserId: selectedFriend._id,
                      roomName,
                      caller: {
                        _id: currentUser._id,
                        username: currentUser.username,
                      },
                    });
                  }}
                >
                  🎤 Voice Call
                </button>
              ) : (
                <>
                  <button
                    className="mute-btn"
                    onClick={() => window.questprintCallControls?.toggleMute()}
                  >
                    {isMuted ? "🔊 Unmute" : "🔇 Mute"}
                  </button>

                  <button
                    className="stream-btn"
                    onClick={() =>
                      window.questprintCallControls?.toggleStream()
                    }
                  >
                    {isStreaming ? "⏹ Stop Stream" : "🖥️ Stream"}
                  </button>

                  

                  <button
                    className="end-call-btn show"
                    onClick={() => window.questprintCallControls?.endCall()}
                  >
                    📞 End
                  </button>
                </>
              )}
            </div>

            {friendStreaming && showStream && (
              <div className="stream-container">
                <ScreenShareView />
              </div>
            )}

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
            <div
              className="friend-item"
              key={friend._id}
              onClick={() =>
                setShowMenu(showMenu === friend._id ? null : friend._id)
              }
            >
              <div className="friend-left">
                <div className="friend-avatar">
                  <div
                    className={
                      onlineUsers.includes(friend._id)
                        ? "friend-avatar-dot-on"
                        : "friend-avatar-dot-off"
                    }
                  ></div>
                  {friend.profilePicture ? (
                    <img
                      src={friend.profilePicture}
                      alt={friend.username}
                      className="friend-avatar-img"
                    />
                  ) : (
                    friend.username[0]
                  )}
                </div>

                <span>{friend.username}</span>
              </div>

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
                    <div className="popup-avatar">
                      {friend.profilePicture ? (
                        <img
                          src={friend.profilePicture}
                          alt={friend.username}
                          className="social-avatar-img"
                        />
                      ) : (
                        friend.username[0]
                      )}
                    </div>

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
        <div className="profile-overlay" onClick={() => setProfileUser(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-profile"
              onClick={() => setProfileUser(null)}
            >
              ✕
            </button>

            <div className="profile-top">
              <div className="profile-avatar">
                {profileUser.profilePicture ? (
                  <img
                    src={profileUser.profilePicture}
                    alt={profileUser.username}
                    className="profile-avatar-img"
                  />
                ) : (
                  profileUser.username[0]
                )}
              </div>

              <h2>{profileUser.username}</h2>

              <p>QuestPrint Explorer</p>
            </div>

            <div className="profile-stats">
              <div className="profile-stat">
                <span>Friends</span>
                <strong>{profileUser.friends?.length || 0}</strong>
              </div>

              <div className="profile-stat">
                <span>Games</span>
                <strong>{profileUser.recommendations?.length || 0}</strong>
              </div>

              <div className="profile-stat">
                <span>Status</span>
                <strong>Active</strong>
              </div>
            </div>

            <div className="profile-section">
              <h3>QuestPrint Personality</h3>

              <div className="personality-grid">
                {Object.entries(profileUser.personality || {}).map(
                  ([trait, value]) => (
                    <div className="trait-card" key={trait}>
                      <div className="trait-header">
                        <span>{trait}</span>

                        <strong>{Math.round(value)}%</strong>
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
                  ),
                )}
              </div>
            </div>

            <div className="profile-section">
              <h3>Recommended Games</h3>

              <div className="profile-games">
                {profileUser.recommendations?.map((game, index) => (
                  <div className="profile-game" key={index}>
                    {game.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {liveKitRoom && (
        <div style={{ display: "none" }}>
          <LiveKitCall
            roomName={liveKitRoom}
            username={currentUser.username}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            isStreaming={isStreaming}
            setIsStreaming={setIsStreaming}
            setLiveKitRoom={setLiveKitRoom}
            setFriendStreaming={setFriendStreaming}
            showStream={showStream}
          />
        </div>
      )}

      {incomingCall && (
        <div className="call-popup">
          <h3>{incomingCall.caller.username} is calling...</h3>

          <div className="call-popup-actions">
            <button
              onClick={() => {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;

                socketRef.current.emit("accept-call", {
                  targetUserId: incomingCall.caller._id,
                  roomName: incomingCall.roomName,
                });

                setLiveKitRoom(incomingCall.roomName);
                setIncomingCall(null);
              }}
            >
              Accept
            </button>

            <button
              onClick={() => {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;

                socketRef.current.emit("reject-call", {
                  targetUserId: incomingCall.caller._id,
                });

                setIncomingCall(null);
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
