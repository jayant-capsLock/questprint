import { Track } from "livekit-client";
import { useTracks, VideoTrack } from "@livekit/components-react";
import { useEffect } from "react";

export default function ScreenShareView({ setFriendStreaming }) {
  const tracks = useTracks([
    {
      source: Track.Source.ScreenShare,
      withPlaceholder: false,
    },
  ]);

  // BUG FIX #2: Removed duplicate useEffect that was doing the same thing twice
  // This was causing unnecessary re-renders and state updates
  useEffect(() => {
    const hasScreenShare = tracks.length > 0;
    setFriendStreaming?.(hasScreenShare);
    
    if (hasScreenShare) {
      console.log("Screen share active - tracks found:", tracks.length);
    }
  }, [tracks, setFriendStreaming]);

  // BUG FIX #3: Proper handling of no tracks
  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="stream-viewer">
      {/* BUG FIX #4: Safely render video track with error handling */}
      {tracks[0] && <VideoTrack trackRef={tracks[0]} />}
    </div>
  );
}
