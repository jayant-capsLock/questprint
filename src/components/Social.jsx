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
  const [socialSearch, setSocialSearch] = useState("");
  const [filteredSocialSearch, setFilteredSocialSearch] = useState("");
  const [socialSearchResults, setSocialSearchResults] = useState([]);
  const screenStreamRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const screenShareContainerRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);

  const currentUserId = currentUser?._id;

  const [showMenu, setShowMenu] = useState(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const remoteUserRef = useRef(null);
  const audioRef = useRef(null);
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const callTimeoutRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);
  const [showScreenShare, setShowScreenShare] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const inCallRef = useRef(false);

  const [shareQuality, setShareQuality] = useState("1080p");

  const [shareAudio, setShareAudio] = useState(true);

  const renegotiate = async () => {
    try {
      console.log("Renegotiation started");

      const offer = await peerRef.current.createOffer();

      await peerRef.current.setLocalDescription(offer);

      socketRef.current.emit("voice-offer", {
        callerId: currentUser._id,
        targetUserId: remoteUserRef.current,
        offer,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const endCall = () => {
    clearTimeout(callTimeoutRef.current);
    socketRef.current.emit("end-call", {
      targetUserId: remoteUserRef.current,
    });

    peerRef.current?.close();

    localStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    screenStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    screenStreamRef.current = null;

    // Clean up audio element
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current.remove();
      audioRef.current = null;
    }

    peerRef.current = null;
    localStreamRef.current = null;
    iceCandidateQueueRef.current = [];
    setIsFullscreen(false);
    setShowScreenShare(true);

    setInCall(false);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];

    audioTrack.enabled = !audioTrack.enabled;

    setIsMuted(!audioTrack.enabled);
  };

  const qualityMap = {
    "4k": {
      width: 3840,
      height: 2160,
    },

    "2k": {
      width: 2560,
      height: 1440,
    },

    "1080p": {
      width: 1920,
      height: 1080,
    },

    "720p": {
      width: 1280,
      height: 720,
    },

    "360p": {
      width: 640,
      height: 360,
    },
  };

  const startScreenShare = async () => {
    try {
      const selected = qualityMap[shareQuality];

      // Request display media with audio option based on user preference
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: selected.width,
          height: selected.height,
        },
        audio: shareAudio ? true : false,
      });

      screenStreamRef.current = screenStream;

      // Add screen video track to peer connection
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender) {
        // Replace existing video track if any
        await sender.replaceTrack(screenTrack);
      } else {
        // Add as new track if no video track exists
        peerRef.current.addTrack(screenTrack, screenStream);
      }

      // If shareAudio was requested, the audio from screen share is already in the stream
      // But we should keep the original voice audio, so don't add screen audio tracks
      // Remove any audio tracks from screen stream to avoid conflicts
      screenStream.getAudioTracks().forEach((track) => {
        track.stop();
      });

      await renegotiate();

      setShowShareModal(false);

      console.log("Screen track added");

      screenTrack.onended = () => {
        console.log("Screen sharing stopped");
        // Stop the screen share
        stopScreenShare();
      };
    } catch (err) {
      console.log(err);
      // User cancelled screen share dialog
      if (err.name === "NotAllowedError") {
        console.log("Screen sharing cancelled by user");
      }
    }
  };

  const stopScreenShare = async () => {
    try {
      if (!screenStreamRef.current) return;

      screenStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      // Replace screen track back with original video track or remove it
      const sender = peerRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender) {
        await sender.replaceTrack(null);
      }

      screenStreamRef.current = null;
      await renegotiate();
    } catch (err) {
      console.log("Error stopping screen share:", err);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen && screenShareContainerRef.current) {
        if (screenShareContainerRef.current.requestFullscreen) {
          await screenShareContainerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error("Error exiting fullscreen:", err);
    }
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
        const track = event.track;

        console.log("Track received:", track.kind);

        if (track.kind === "audio") {
          if (!audioRef.current) {
            audioRef.current = new Audio();
          }
          audioRef.current.srcObject = event.streams[0];
          audioRef.current.play().catch((e) => console.log("Auto-play error:", e));
        }

        if (track.kind === "video") {
          setRemoteScreenStream(event.streams[0]);
        }
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
    inCallRef.current = inCall;
  }, [inCall]);

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
        console.log("Peer not ready yet, queueing ICE candidate");
        iceCandidateQueueRef.current.push(candidate);
        return;
      }

      // Only add ICE candidate if remote description is set
      if (!peerRef.current.remoteDescription) {
        console.log("Remote description not set yet, queueing ICE candidate");
        iceCandidateQueueRef.current.push(candidate);
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

        await peerRef.current.setRemoteDescription(answer);

        console.log("CALL CONNECTED 🎉");

        // Process queued ICE candidates
        while (iceCandidateQueueRef.current.length > 0) {
          const queuedCandidate = iceCandidateQueueRef.current.shift();
          try {
            await peerRef.current.addIceCandidate(
              new RTCIceCandidate(queuedCandidate),
            );
            console.log("Queued ICE added");
          } catch (err) {
            console.error(err);
          }
        }
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

      screenStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      screenStreamRef.current = null;

      // Clean up audio element
      if (audioRef.current) {
        audioRef.current.srcObject = null;
        audioRef.current.remove();
        audioRef.current = null;
      }

      peerRef.current = null;
      localStreamRef.current = null;
      iceCandidateQueueRef.current = [];

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
        console.log(
          "Offer received",
          inCallRef.current,
          peerRef.current?.connectionState,
        );
        if (peerRef.current && peerRef.current.connectionState !== "closed") {
          console.log("Renegotiation offer received");

          await peerRef.current.setRemoteDescription(offer);

          const answer = await peerRef.current.createAnswer();

          await peerRef.current.setLocalDescription(answer);

          socketRef.current.emit("voice-answer", {
            targetUserId: callerId,
            answer,
          });

          return;
        }
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

      screenStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      screenStreamRef.current = null;

      // Clean up audio element
      if (audioRef.current) {
        audioRef.current.srcObject = null;
        audioRef.current.remove();
        audioRef.current = null;
      }

      peerRef.current = null;
      localStreamRef.current = null;
      iceCandidateQueueRef.current = [];

      setIsFullscreen(false);
      setShowScreenShare(true);
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

    try {
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
        const track = event.track;

        console.log("Track received:", track.kind);

        if (track.kind === "audio") {
          if (!audioRef.current) {
            audioRef.current = new Audio();
          }
          audioRef.current.srcObject = event.streams[0];
          audioRef.current.play().catch((e) => console.log("Auto-play error:", e));
        }

        if (track.kind === "video") {
          setRemoteScreenStream(event.streams[0]);
        }
      };

      stream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, stream);
      });

      console.log("Receiver peer created");

      await peerRef.current.setRemoteDescription(offer);

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

      // Process queued ICE candidates
      while (iceCandidateQueueRef.current.length > 0) {
        const queuedCandidate = iceCandidateQueueRef.current.shift();
        try {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(queuedCandidate),
          );
          console.log("Queued ICE added");
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.error("Error accepting call:", err);
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
    socketRef.current.off("new-message");

    socketRef.current.on("new-message", (message) => {
      const isCurrentChat =
        selectedFriend &&
        (selectedFriend._id === message.sender ||
          selectedFriend._id === message.receiver);

      if (!isCurrentChat) {
        messageSoundRef.current?.play();
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

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
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
              <div className={`call-controls ${inCall ? "active" : ""}`}>
                <button
                  className={`voice-btn ${inCall ? "shrink" : ""}`}
                  onClick={inCall ? toggleMute : startVoiceCall}
                >
                  {inCall
                    ? isMuted
                      ? "🔇 Unmute"
                      : "🎤 Mute"
                    : "🎤 Voice Call"}
                </button>
                {inCall && (
                  <button
                    className="share-screen-btn"
                    onClick={() => setShowShareModal(true)}
                  >
                    🖥️ Share
                  </button>
                )}

                {remoteScreenStream && !showScreenShare && (
                  <button
                    className="watch-stream-btn"
                    onClick={() => setShowScreenShare(true)}
                  >
                    📺 Watch Stream
                  </button>
                )}

                <button
                  className={`end-call-btn ${inCall ? "show" : ""}`}
                  onClick={endCall}
                >
                  📞
                </button>
              </div>
            </div>
            {remoteScreenStream && showScreenShare && (
              <div
                className={`screenShareContainer ${
                  isFullscreen ? "fullscreen" : ""
                }`}
                ref={screenShareContainerRef}
              >
                <video
                  autoPlay
                  playsInline
                  ref={(video) => {
                    if (video) {
                      video.srcObject = remoteScreenStream;
                    }
                  }}
                />
                <div className="screen-header">
                  <div className="screen-title">🖥️ Screen Share</div>

                  <div className="screen-actions">
                    <button onClick={toggleFullscreen}>
                      {isFullscreen ? "🗗" : "⛶"}
                    </button>

                    <button onClick={() => setShowScreenShare(false)}>✕</button>
                  </div>
                </div>
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
      {incomingCall && (
        <div className="call-popup">
          <h3>📞 Incoming Call</h3>

          <button onClick={acceptCall}>Accept</button>

          <button onClick={declineCall}>Decline</button>
        </div>
      )}

      {showShareModal && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <h3>Screen Share</h3>

            <label>Quality</label>

            <select
              value={shareQuality}
              onChange={(e) => setShareQuality(e.target.value)}
            >
              <option value="4k">4K</option>
              <option value="2k">2K</option>
              <option value="1080p">1080P</option>
              <option value="720p">720P</option>
              <option value="360p">360P</option>
            </select>

            <label>
              <input
                type="checkbox"
                checked={shareAudio}
                onChange={(e) => setShareAudio(e.target.checked)}
              />
              Stream Audio
            </label>

            <button onClick={startScreenShare}>Start Sharing</button>

            <button onClick={() => setShowShareModal(false)}>Cancel</button>
          </div>
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
    </div>
  );
}
