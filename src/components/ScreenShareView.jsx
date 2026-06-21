import { Track } from "livekit-client";
import { useTracks, VideoTrack } from "@livekit/components-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ScreenShareView({ setFriendStreaming }) {
  const tracks = useTracks([
    {
      source: Track.Source.ScreenShare,
      withPlaceholder: false,
    },
  ]);

  useEffect(() => {
    const hasScreenShare = tracks && tracks.length > 0;
    setFriendStreaming?.(hasScreenShare);

    if (hasScreenShare) {
      console.log("Screen share active - tracks found:", tracks.length);
    }
  }, [tracks, setFriendStreaming]);

  if (!tracks || tracks.length === 0) {
    return null;
  }

  // Build the rendered element (support multiple tracks just in case)
  const content = (
    <div className="stream-viewer">
      {tracks.map((t, i) => {
        const publication = t.publication || t.trackPublication || null;
        const participant = t.participant || null;
        const key = publication?.trackSid || (t.track && t.track.sid) || i;
        const source = publication?.source || Track.Source.ScreenShare;

        // Prefer using the high-level VideoTrack component when participant is available
        if (participant) {
          return (
            <VideoTrack
              key={key}
              participant={participant}
              source={source}
            />
          );
        }

        // Fallback: if we don't have participant/publication, try rendering nothing
        return null;
      })}
    </div>
  );

  // If there's a visible stream container in the page, portal the video there so
  // the LiveKitRoom (which may be mounted elsewhere/hidden) can render into it.
  const target = typeof document !== "undefined" && document.getElementById("stream-root");

  if (target) return createPortal(content, target);

  return content;
}
