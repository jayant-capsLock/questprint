import { useState } from "react";
import axios from "axios";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from "@livekit/components-react";

export default function CallTest() {
  const [token, setToken] = useState(null);

  const joinRoom = async () => {
    const { data } = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/livekit/token`,
      {
        params: {
          room: "test-room",
          username: "user-" + Date.now(),
        },
      }
    );

    setToken(data.token);
  };

  if (!token) {
    return <button onClick={joinRoom}>Join Test Room</button>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      connect={true}
      audio={true}
      video={false}
    >
      <RoomAudioRenderer />
      <VideoConference />
    </LiveKitRoom>
  );
}