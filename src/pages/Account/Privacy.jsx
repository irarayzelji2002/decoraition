function Privacy() {
  return (
    <div>
      <div
        style={{
          background: "var(--bg-header)",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <div className="center-me" style={{ margin: "24px" }}>
          <h1 className="navName">Privacy Policy</h1>
          <p style={{ maxWidth: "800px" }}>
            Our Privacy Policy explains how we collect, use, and protect your data. By using
            DecorAItion, you consent to our data practices as outlined in the Privacy Policy. <br />
            <br />
            DecorAItion (“DecorAItion,” “Company,” “we,” or “us”) is committed to respecting and
            protecting your privacy. This Privacy Policy outlines our data processing practices for
            visitors to our websites that link to this Privacy Policy (“Website”) and for customers
            using our Services (“Customer”).
          </p>
        </div>
        <div
          className="faq-box"
          style={{
            width: "80%",
            maxWidth: "800px",
            color: "var(--color-grey)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <p>
            For clarity, “Service(s)” refers to any software, resources, tools, applications,
            downloadable items, or features provided by DecorAItion, updates, and other enhancements
            to our offerings.
          </p>

          <h2>1. Changes to the Policy</h2>
          <p>
            We reserve the right to update this Privacy Policy at any time. Changes take effect
            immediately upon posting the revised Privacy Policy. Your continued use of our Services
            signifies acceptance of these changes. If significant updates are made, we will notify
            you here, by email, or via a notice on our Website.
          </p>

          <h2>2. Information Collection</h2>
          <p>
            Depending on your interactions with us, we may collect the following types of
            information:
          </p>
          <p>
            <strong>Non-Personal Information:</strong>This is non-identifiable information that may
            include your device's operating system, browser type, language, access date and time,
            usage data (e.g., pages viewed), Internet service provider, and approximate location.
            This data helps us enhance your experience and improve our Services.
          </p>
          <p>
            <strong>Personal Information:</strong> This is identifiable information you voluntarily
            provide, such as your name, email, contact information, IP address, and other online
            identifiers. Personal Information may be collected when you register for our Services,
            use our Website, or contact us for support.
          </p>

          <p>We collect and process your data under various legal bases:</p>
          <p>
            <strong>Contractual Necessity:</strong> To provide our services to you.
          </p>
          <p>
            <strong>Legitimate Interest:</strong> For online tracking and marketing. you.
          </p>
          <p>
            <strong>Consent:</strong> Where you have opted in to specific uses for your data.
          </p>

          <p>
            You are not obligated to provide us with Personal Information, though certain features
            may not be available without it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
