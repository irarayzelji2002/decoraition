import { useSharedProps } from "../contexts/SharedPropsContext";
import "../css/loadingpage.css";

function LoadingPage({ message = "" }) {
  const { isDarkMode } = useSharedProps();
  return (
    <div className="loaderpage">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <div className="loader" style={{ height: "100%", width: "100%" }}>
          <h1 className="navName loader" style={{ height: "auto" }}>
            Loading...
          </h1>
          <div class="dot-spinner">
            <div class="dot-spinner__dot"></div>
            <div class="dot-spinner__dot"></div>
            <div class="dot-spinner__dot"></div>
            <div class="dot-spinner__dot"></div>
            <div class="dot-spinner__dot"></div>
            <div class="dot-spinner__dot"></div>
            <div class="dot-spinner__dot"></div>
            <div class="dot-spinner__dot"></div>
          </div>
          {message && (
            <div
              style={{
                color: isDarkMode ? "var(--greyText)" : "var(--color-white)",
                width: "300px",
                textAlign: "center",
                marginTop: "15px",
              }}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoadingPage;
