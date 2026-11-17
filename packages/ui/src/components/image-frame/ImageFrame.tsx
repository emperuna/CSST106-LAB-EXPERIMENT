interface Props {
  src: string;
  alt: string;
  title: string;
  readout?: string | null;
  /** A short mono label before the title, such as the procedure step. */
  tag?: string;
  onOpen?: () => void;
}

/** An image in a neutral well with viewfinder ticks. Nothing is drawn over the image itself. */
export function ImageFrame({ src, alt, title, readout, tag, onOpen }: Props) {
  const image = <img src={src} alt={alt} />;
  return (
    <figure className="panel">
      {onOpen ? (
        <button type="button" className="frame" onClick={onOpen} aria-label={`Enlarge: ${title}`}>
          {image}
        </button>
      ) : (
        <div className="frame">{image}</div>
      )}
      <figcaption>
        {tag && <span className="frame-tag">{tag}</span>}
        <strong>{title}</strong>
        {readout && <span>{readout}</span>}
      </figcaption>
    </figure>
  );
}
