import { Track } from "livekit-client";
import { useTracks } from "@livekit/components-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ScreenShareView({ setFriendStreaming }) {
  const tracks = useTracks([
    {
      source: Track.Source.ScreenShare,
      withPlaceholder: false,
    },
  ]);

  const videoRefs = useRef([]);

  useEffect(() => {
    const hasScreenShare = tracks && tracks.length > 0;
    setFriendStreaming?.(hasScreenShare);

    if (hasScreenShare) {
      console.log("Screen share active - tracks found:", tracks.length);
    }

    // Attach any available track to the corresponding video element
    const detachFns = [];

    tracks.forEach((t, i) => {
      const publication = t.publication || t.trackPublication || t;
      const trackObj = publication?.track || t.track || null;
      const el = videoRefs.current[i];

      if (trackObj && el) {
        try {
          // livekit track has attach/detach
          trackObj.attach(el);

          detachFns.push(() => {
            try {
              trackObj.detach(el);
            } catch (e) {
              // ignore
            }
          });
        } catch (err) {
          console.warn("Failed to attach track to element:", err);
        }
      }
    });

    return () => {
      detachFns.forEach((fn) => fn());
    };
  }, [tracks, setFriendStreaming]);

  if (!tracks || tracks.length === 0) {
    return null;
  }

  const content = (
    <div className="stream-viewer">
      {tracks.map((t, i) => {
        const publication = t.publication || t.trackPublication || t;
        const key = publication?.trackSid || (t.track && t.track.sid) || i;

        return (
          <video
            key={key}
            ref={(el) => (videoRefs.current[i] = el)}
            autoPlay
            playsInline
            muted={false}
            className="shared-screen"
            style={{ width: "100%", height: "100%" }}
          />
        );
      })}
    </div>
  );

  const target = typeof document !== "undefined" && document.getElementById("stream-root");
  if (target) return createPortal(content, target);

  return content;
}
