import { useRoomContext } from "@livekit/components-react";
import { useEffect } from "react";
import { Track } from "livekit-client";
import { useTracks } from "@livekit/components-react";

export default function LiveKitControls({
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
        try {
          if (!room || !room.localParticipant) {
            console.warn("toggleMute: room or localParticipant not ready");
            return;
          }

          const newMutedState = !isMuted;
          // enable microphone when newMutedState is false
          await room.localParticipant.setMicrophoneEnabled(!newMutedState);
          setIsMuted(newMutedState);
        } catch (err) {
          console.error("toggleMute failed:", err);
        }
      },

      toggleStream: async () => {
        try {
          if (!room || !room.localParticipant) {
            console.warn("toggleStream: room or localParticipant not ready");
            return;
          }

          const newStreamingState = !isStreaming;

          if (!isStreaming) {
            // start screen share
            await room.localParticipant.setScreenShareEnabled(true);
          } else {
            // stop screen share
            await room.localParticipant.setScreenShareEnabled(false);
          }

          // only update UI state after successful API call
          setIsStreaming(newStreamingState);
        } catch (error) {
          console.error("Error toggling screen share:", error);
        }
      },

      endCall: () => {
        try {
          if (room) room.disconnect();
        } catch (err) {
          console.warn("Error disconnecting room:", err);
        } finally {
          setLiveKitRoom(null);
          setIsMuted(false);
          setIsStreaming(false);
        }
      },
    };

    return () => {
      delete window.questprintCallControls;
    };
  }, [room, isMuted, isStreaming, setIsMuted, setIsStreaming, setLiveKitRoom]);

  return null;
}
