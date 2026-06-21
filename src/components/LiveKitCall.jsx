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
}) {
  const [token, setToken] = useState(null);

 



  useEffect(() => {
    const getToken = async () => {
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
    };

    getToken();
  }, [roomName, username]);

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
      />
      <RoomAudioRenderer />
      <ScreenShareView />
      <VideoConference />
    </LiveKitRoom>
  );
}
