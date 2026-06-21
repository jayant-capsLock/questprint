import { useRoomContext } from "@livekit/components-react";
import { useEffect, useRef, useState } from "react";
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

  const screenTrackRef = useRef(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    window.questprintCallControls = {
      toggleMute: async () => {
        try {
          if (!room || !room.localParticipant) {
            console.warn("toggleMute: room or localParticipant not ready");
            return;
          }

          const newMutedState = !isMuted;
          await room.localParticipant.setMicrophoneEnabled(!newMutedState);
          setIsMuted(newMutedState);
        } catch (err) {
          console.error("toggleMute failed:", err);
        }
      },

      toggleStream: async () => {
        if (isToggling) return;
        if (!room || !room.localParticipant) {
          console.warn("toggleStream: room or localParticipant not ready");
          return;
        }

        setIsToggling(true);

        try {
          if (!isStreaming) {
            // Start screen share: prefer manual getDisplayMedia + publish for reliability
            try {
              const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
              const track = stream.getTracks()[0];

              // publish the track
              const publication = await room.localParticipant.publishTrack(track, { simulcast: false });

              screenTrackRef.current = { track, publication, stream };

              setIsStreaming(true);
            } catch (err) {
              console.error("Failed to start screen share:", err);
            }
          } else {
            // Stop screen share
            if (screenTrackRef.current) {
              try {
                const pub = screenTrackRef.current.publication;
                const track = screenTrackRef.current.track;

                // try to unpublish using publication or track
                try {
                  if (pub && pub.track) {
                    await room.localParticipant.unpublishTrack(pub.track);
                  } else if (track) {
                    await room.localParticipant.unpublishTrack(track);
                  }
                } catch (e) {
                  console.warn("unpublishTrack failed, trying alternative detach:", e);
                }

                try { track?.stop(); } catch (e) {}
                try { screenTrackRef.current.stream?.getTracks().forEach(t => t.stop()); } catch (e) {}
              } finally {
                screenTrackRef.current = null;
              }

              setIsStreaming(false);
            } else {
              // fallback to convenience API if available
              if (typeof room.localParticipant.setScreenShareEnabled === "function") {
                try {
                  await room.localParticipant.setScreenShareEnabled(false);
                } catch (e) {
                  console.warn("fallback setScreenShareEnabled(false) failed:", e);
                }
              }

              setIsStreaming(false);
            }
          }
        } catch (err) {
          console.error("toggleStream failed:", err);
        } finally {
          setIsToggling(false);
        }
      },

      endCall: () => {
        try {
          if (room) room.disconnect();
        } catch (err) {
          console.warn("Error disconnecting room:", err);
        } finally {
          // cleanup any published screen track
          try {
            if (screenTrackRef.current?.track) {
              try { screenTrackRef.current.track.stop(); } catch (e) {}
              try { screenTrackRef.current.stream?.getTracks().forEach(t => t.stop()); } catch (e) {}
            }
          } catch (e) {
            // ignore
          }

          screenTrackRef.current = null;
          setLiveKitRoom(null);
          setIsMuted(false);
          setIsStreaming(false);
        }
      },

      _isToggling: () => isToggling,
    };

    return () => {
      delete window.questprintCallControls;
      // ensure we stop any leftover track when the component unmounts
      try {
        if (screenTrackRef.current?.track) {
          try { screenTrackRef.current.track.stop(); } catch (e) {}
          try { screenTrackRef.current.stream?.getTracks().forEach(t => t.stop()); } catch (e) {}
        }
      } catch (e) {}
      screenTrackRef.current = null;
    };
  }, [room, isMuted, isStreaming, setIsMuted, setIsStreaming, setLiveKitRoom, isToggling]);

  return null;
}
