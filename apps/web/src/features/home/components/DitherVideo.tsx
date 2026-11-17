import { useDitherVideo } from "../hooks/useDitherVideo";

interface Props {
  src: string;
  poster: string;
}

// Inline, so the raw footage stays hidden even before the stylesheet loads. The video only feeds
// the shader; it stays in the page because some browsers stop decoding a detached video.
const HIDDEN = {
  position: "absolute",
  width: 1,
  height: 1,
  opacity: 0,
  pointerEvents: "none",
} as const;

/**
 * The hero's moving picture: NASA spacewalk footage redrawn as ordered-dither pixels by a WebGL
 * shader. Without WebGL2 it shows the poster frame.
 */
export function DitherVideo({ src, poster }: Props) {
  const { canvasRef, videoRef, fallback } = useDitherVideo();

  return (
    <div className="dither-video">
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        crossOrigin="anonymous"
        style={HIDDEN}
      />
      {fallback ? (
        <img className="dither-video-poster" src={poster} alt="" />
      ) : (
        <canvas ref={canvasRef} aria-hidden="true" />
      )}
    </div>
  );
}
