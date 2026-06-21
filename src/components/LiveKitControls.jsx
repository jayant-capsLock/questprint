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
        // BUG FIX #1: Fixed inverted mute logic
        // When isMuted is true, we want to DISABLE the microphone
        // When isMuted is false, we want to ENABLE the microphone
        const newMutedState = !isMuted;
        await room.localParticipant.setMicrophoneEnabled(!newMutedState);
        setIsMuted(newMutedState);
      },

      toggleStream: async () => {
        const newStreamingState = !isStreaming;
        
        try {
          if (!isStreaming) {
            // Enable screen sharing
            await room.localParticipant.setScreenShareEnabled(true);
          } else {
            // Disable screen sharing
            await room.localParticipant.setScreenShareEnabled(false);
          }
          
          setIsStreaming(newStreamingState);
        } catch (error) {
          console.error("Error toggling screen share:", error);
          // Optionally revert state if toggle fails
        }
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
  }, [room, isMuted, isStreaming, setIsMuted, setIsStreaming, setLiveKitRoom]);

  return null;
}
