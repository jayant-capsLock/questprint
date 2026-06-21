import { useRoomContext } from "@livekit/components-react";
import { useEffect } from "react";
import { Track } from "livekit-client";
import { useTracks } from "@livekit/components-react";

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
  const room = useRoomContext();

  const tracks = useTracks([
    {
      source: Track.Source.ScreenShare,
      withPlaceholder: false,
    },
  ]);

  useEffect(() => {
    window.questprintCallControls = {
      toggleMute: async () => {
        await room.localParticipant.setMicrophoneEnabled(isMuted);

        setIsMuted(!isMuted);
      },

      toggleStream: async () => {
        if (!isStreaming) {
          await room.localParticipant.setScreenShareEnabled(true);
        } else {
          await room.localParticipant.setScreenShareEnabled(false);
        }

        setIsStreaming(!isStreaming);
      },

      endCall: () => {
        room.disconnect();

        setLiveKitRoom(null);
        setIsMuted(false);
        setIsStreaming(false);
      },
    };

    return () => {
      delete window.questprintCallControls;
    };
  }, [room, isMuted, isStreaming]);

  return null;
}
