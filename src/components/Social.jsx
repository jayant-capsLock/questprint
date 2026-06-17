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
  const ringtoneRef = useRef(null);
  const messageSoundRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);

  const currentUserId = currentUser?._id;

  const [showMenu, setShowMenu] = useState(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const remoteUserRef = useRef(null);
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const callTimeoutRef = useRef(null);

  const endCall = () => {
    clearTimeout(callTimeoutRef.current);
    socketRef.current.emit("cancel-call", {
      targetUserId: remoteUserRef.current,
    });

    peerRef.current?.close();

    localStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    peerRef.current = null;
    localStreamRef.current = null;

    setInCall(false);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];

    audioTrack.enabled = !audioTrack.enabled;

    setIsMuted(!audioTrack.enabled);
  };

  const startVoiceCall = async () => {
    try {
      console.log("START CALL CLICKED");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      localStreamRef.current = stream;
      peerRef.current = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });

      peerRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE");
          socketRef.current.emit("ice-candidate", {
            targetUserId: remoteUserRef.current,
            candidate: event.candidate,
          });
        }
      };

      peerRef.current.ontrack = (event) => {
        console.log("Remote stream received");

        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play();
      };
      console.log(peerRef.current);

      console.log(stream);

      setInCall(true);

      stream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, stream);
      });

      console.log(peerRef.current.getSenders());

      console.log("CREATING OFFER");
      const offer = await peerRef.current.createOffer();

      await peerRef.current.setLocalDescription(offer);
      console.log("LOCAL DESCRIPTION SET");
      remoteUserRef.current = selectedFriend._id;
      socketRef.current.emit("voice-offer", {
        callerId: currentUser._id,
        targetUserId: selectedFriend._id,
        offer,
      });
      console.log("VOICE OFFER SENT");
      console.log("TARGET:", selectedFriend._id);

      console.log(offer);
    } catch (err) {
      console.error(err);
    }
  };

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
    ringtoneRef.current = new Audio("/ringtone.mp3");

    ringtoneRef.current.loop = true;
  }, []);

  useEffect(() => {
    messageSoundRef.current = new Audio("/notification.mp3");
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("incoming-ice-candidate", async ({ candidate }) => {
      console.log("Received ICE");

      if (!peerRef.current) {
        console.log("Peer not ready yet");
        return;
      }

      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));

        console.log("ICE added");
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      socket.off("incoming-ice-candidate");
    };
  }, []);

  useEffect(() => {
    socketRef.current.on("incoming-voice-answer", async ({ answer }) => {
      try {
        console.log("Answer received");

        if (peerRef.current.signalingState !== "have-local-offer") {
          console.log("Skipping wrong state");
          return;
        }

        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer),
        );

        console.log("CALL CONNECTED 🎉");
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      socketRef.current.off("incoming-voice-answer");
    };
  }, []);

  useEffect(() => {
    socketRef.current.on("call-cancelled", () => {
      clearTimeout(callTimeoutRef.current);

      ringtoneRef.current?.pause();
      ringtoneRef.current.currentTime = 0;

      peerRef.current?.close();

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      peerRef.current = null;
      localStreamRef.current = null;

      setIncomingCall(null);
      setInCall(false);

      console.log("Caller cancelled");
    });

    return () => {
      socketRef.current.off("call-cancelled");
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
    socketRef.current.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socketRef.current.off("online-users");
    };
  }, []);

  useEffect(() => {
    socketRef.current.on(
      "incoming-voice-offer",
      async ({ offer, callerId }) => {
        console.log("INCOMING CALL RECEIVED");
        remoteUserRef.current = callerId;

        setIncomingCall({
          offer,
          callerId,
        });

        callTimeoutRef.current = setTimeout(() => {
          ringtoneRef.current?.pause();
          ringtoneRef.current.currentTime = 0;

          setIncomingCall(null);

          socketRef.current.emit("cancel-call", {
            targetUserId: callerId,
          });
        }, 180000);
        ringtoneRef.current?.play();
      },
    );

    return () => {
      socketRef.current.off("incoming-voice-offer");
    };
  }, []);

  useEffect(() => {
    socketRef.current.on("call-ended", () => {
      peerRef.current?.close();

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      peerRef.current = null;
      localStreamRef.current = null;

      setInCall(false);

      console.log("Other user ended call");
    });

    return () => {
      socketRef.current.off("call-ended");
    };
  }, []);
  const declineCall = () => {
    clearTimeout(callTimeoutRef.current);
    ringtoneRef.current?.pause();
    ringtoneRef.current.currentTime = 0;

    setIncomingCall(null);
    socketRef.current.emit("cancel-call", {
      targetUserId: incomingCall.callerId,
    });
  };
  const acceptCall = async () => {
    clearTimeout(callTimeoutRef.current);
    ringtoneRef.current?.pause();
    ringtoneRef.current.currentTime = 0;
    const { offer, callerId } = incomingCall;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    localStreamRef.current = stream;

    peerRef.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE");

        socketRef.current.emit("ice-candidate", {
          targetUserId: callerId,
          candidate: event.candidate,
        });
      }
    };

    peerRef.current.ontrack = (event) => {
      console.log("Remote stream received");

      const audio = document.createElement("audio");

      audio.srcObject = event.streams[0];
      audio.autoplay = true;

      document.body.appendChild(audio);
    };

    stream.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, stream);
    });

    console.log("Receiver peer created");

    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(offer),
    );

    console.log("Remote description set");

    const answer = await peerRef.current.createAnswer();

    await peerRef.current.setLocalDescription(answer);

    console.log("Answer created");

    socketRef.current.emit("voice-answer", {
      targetUserId: callerId,
      answer,
    });

    setIncomingCall(null);
    setInCall(true);
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
      if (selectedFriend?._id !== message.sender) {
        messageSoundRef.current?.play();
      }
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
              {!inCall ? (
                <button className="voice-btn" onClick={startVoiceCall}>
                  🎤 Voice Call
                </button>
              ) : (
                <div className="call-controls">
                  <button className="voice-btn" onClick={toggleMute}>
                    {isMuted ? "🔇 Unmute" : "🎤 Mute"}
                  </button>

                  <button className="voice-btn end-call-btn" onClick={endCall}>
                    📞 End Call
                  </button>
                </div>
              )}
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
      {incomingCall && (
        <div className="call-popup">
          <h3>📞 Incoming Call</h3>

          <button onClick={acceptCall}>Accept</button>

          <button onClick={declineCall}>Decline</button>
        </div>
      )}
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
              <div className="profile-avatar">{profileUser.username[0]}</div>

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
    </div>
  );
}
