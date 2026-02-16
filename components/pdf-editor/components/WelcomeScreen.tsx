type WelcomeScreenProps = {
  onOpen: () => void;
};

export const WelcomeScreen = ({ onOpen }: WelcomeScreenProps) => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">PDF</div>
        <h1 className="welcome-title">PDF Suite</h1>
        <p className="welcome-subtitle">
          Open a PDF to get started, or drag and drop files here.
        </p>
        <div className="welcome-actions">
          <button className="button-primary welcome-open-btn" onClick={onOpen}>
            Open PDF
          </button>
        </div>
        <div className="welcome-shortcuts">
          <div className="welcome-shortcut"><kbd>Ctrl+O</kbd> Open file</div>
          <div className="welcome-shortcut"><kbd>Ctrl+F</kbd> Find in document</div>
          <div className="welcome-shortcut"><kbd>Ctrl+G</kbd> Go to page</div>
          <div className="welcome-shortcut"><kbd>Ctrl+S</kbd> Export PDF</div>
          <div className="welcome-shortcut"><kbd>Ctrl+Z</kbd> Undo</div>
          <div className="welcome-shortcut"><kbd>Ctrl++/−</kbd> Zoom in/out</div>
          <div className="welcome-shortcut"><kbd>Esc</kbd> Deselect tool</div>
        </div>
      </div>
    </div>
  );
};
