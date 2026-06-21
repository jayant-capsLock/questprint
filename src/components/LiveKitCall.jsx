import { useEffect, useState } from "react";
import axios from "axios";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from "@livekit/components-react";

import LiveKitControls from "./LiveKitControls";

import ScreenShareView from "./ScreenShareView";

export default function LiveKitCall({
  roomName,
  username,
  isMuted,
  setIsMuted,
  isStreaming,
  setIsStreaming,
  setLiveKitRoom,
  setFriendStreaming,
  showStream,
}) {
  const [token, setToken] = useState(null);
  const [tokenError, setTokenError] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/livekit/token`,
          {
            params: {
              room: roomName,
              username,
            },
          },
        );

        setToken(data.token);
        setTokenError(null);
      } catch (error) {
        console.error("Failed to get LiveKit token:", error);
        setTokenError(error.message);
      }
    };

    if (roomName && username) {
      getToken();
    }
  }, [roomName, username]);

  // BUG FIX #6: Added error state handling
  if (tokenError) {
    return (
      <div className="error-message">
        Failed to connect to call: {tokenError}
      </div>
    );
  }

  if (!token) return null;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      connect={true}
      audio={true}
      video={false}
    >
      <LiveKitControls
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isStreaming={isStreaming}
        setIsStreaming={setIsStreaming}
        setLiveKitRoom={setLiveKitRoom}
        setFriendStreaming={setFriendStreaming}
      />
      <RoomAudioRenderer />

      {/* BUG FIX #7: Always render ScreenShareView, let it handle visibility */}
      {/* This ensures tracks are properly subscribed regardless of showStream */}
      <ScreenShareView setFriendStreaming={setFriendStreaming} />
    </LiveKitRoom>
  );
}
