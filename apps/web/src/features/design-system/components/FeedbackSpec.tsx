import { ErrorMessage, Gauge, Loader, StatusBadge, Tabs } from "@reticle/ui";

/** Status, error, loading and empty states, then tabs and the gauge. */
export function FeedbackSpec() {
  return (
    <div className="ds-grid">
      <div className="ds-specimen">
        <span className="ds-label">Status</span>
        <div className="ds-row">
          <StatusBadge tone="success">API online</StatusBadge>
          <StatusBadge tone="danger">API offline</StatusBadge>
          <StatusBadge>Checking API</StatusBadge>
        </div>
      </div>
      <div className="ds-specimen">
        <span className="ds-label">Error</span>
        <ErrorMessage>That file could not be read as an image.</ErrorMessage>
      </div>
      <div className="ds-specimen">
        <span className="ds-label">Loading</span>
        <Loader label="Running" />
      </div>
      <div className="ds-specimen">
        <span className="ds-label">Empty state</span>
        <p className="waiting">Choose your settings, then run.</p>
      </div>
      <div className="ds-specimen">
        <span className="ds-label">Tabs</span>
        <Tabs
          tabs={[
            { label: "Image", content: <p className="field-note">The first tab panel.</p> },
            { label: "Video", content: <p className="field-note">The second tab panel.</p> },
            { label: "Webcam", content: <p className="field-note">The third tab panel.</p> },
          ]}
        />
      </div>
      <div className="ds-specimen">
        <span className="ds-label">Gauge</span>
        <Gauge
          label="Canny edge pixels"
          value={6.16}
          max={25}
          format={(value) => `${value.toFixed(1)}%`}
        />
      </div>
    </div>
  );
}
