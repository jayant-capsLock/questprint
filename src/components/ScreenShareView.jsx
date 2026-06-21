import { Track } from "livekit-client";
import {
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { useEffect } from "react";

export default function ScreenShareView({
  setFriendStreaming,
}) {
  const tracks = useTracks([
    {
      source: Track.Source.ScreenShare,
      withPlaceholder: false,
    },
  ]);

  useEffect(() => {
    setFriendStreaming?.(tracks.length > 0);
  }, [tracks, setFriendStreaming]);

  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="stream-viewer">
      <VideoTrack trackRef={tracks[0]} />
    </div>
  );
}