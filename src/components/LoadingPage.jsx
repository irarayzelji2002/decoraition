import "../css/loadingpage.css";

function LoadingPage() {
  return (
    <>
      <div className="loaderpage">
        <h1 className="navName" style={{ fontSize: "48px" }}>
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
      </div>
    </>
  );
}

export default LoadingPage;
