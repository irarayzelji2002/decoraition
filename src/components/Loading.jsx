import "../css/loading.css";

function Loading({ fullScreen = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <div
        className="loader"
        style={{ height: fullScreen ? "100%" : "auto", width: fullScreen ? "100%" : "auto" }}
      >
        <h1 className="navName loader" style={{ fontSize: "10px !important" }}>
          Loading...
        </h1>
        <div className="dot-spinner">
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
        </div>
      </div>
    </div>
  );
}

export default Loading;
