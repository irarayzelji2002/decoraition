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
            Our Privacy Policy explains how we collect, use, and protect your
            data. By using DecorAItion, you consent to our data practices as
            outlined in the Privacy Policy.
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
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using DecorAItion, you agree to be bound by these
            Terms and Conditions, as well as our Privacy Policy. If you do not
            agree with any part of these terms, you are prohibited from using
            the app.
          </p>

          <h2>2. Service Description</h2>
          <p>
            DecorAItion provides tools for generating decoration ideas, managing
            project timelines, tracking budgets, and facilitating collaboration.
            Our services include access to AI-generated design suggestions,
            project management features, and collaborative options.
          </p>

          <h2>3. Account Creation and Security</h2>
          <p>
            <strong>Account Requirements:</strong> You must be at least 18 years
            old or have parental consent to create an account.
          </p>
          <p>
            <strong>Account Security:</strong> You are responsible for
            maintaining the confidentiality of your account information.
            DecorAItion will not be liable for any loss or damage from
            unauthorized account use.
          </p>

          <h2>4. User Content and Responsibility</h2>
          <p>
            <strong>Content Ownership:</strong> You retain ownership of any
            designs, project data, or other content you upload. By uploading
            content, you grant DecorAItion permission to store, display, and
            process it as necessary to provide our services.
          </p>
          <p>
            <strong>User Responsibility:</strong> You agree not to use
            DecorAItion for unlawful activities, to upload harmful content, or
            to infringe on third-party intellectual property rights.
          </p>

          <h2>5. AI-Generated Content Disclaimer</h2>
          <p>
            DecorAItion offers AI-generated design suggestions. While we strive
            for quality, these suggestions are for guidance only and may not be
            suitable for all purposes. DecorAItion does not guarantee the
            accuracy or safety of AI-generated content.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
