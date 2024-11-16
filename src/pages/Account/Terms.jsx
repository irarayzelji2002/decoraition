function Terms() {
  return (
    <div>
      <div
        style={{
          backgroundImage: "var(--bg-decor)",
          animation: "moveBackground 70s infinite",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <div className="center-me" style={{ margin: "24px" }}>
          <h1 className="navName">Terms & Conditions</h1>
          <p style={{ maxWidth: "800px" }}>
            Welcome to DecorAItion, a web application that provides AI-powered design assistance for
            home, commercial, and outdoor projects. By using DecorAItion, you agree to these Terms
            and Conditions. If you do not agree, please do not use our services.
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
            By accessing or using DecorAItion, you agree to be bound by these Terms and Conditions,
            as well as our Privacy Policy. If you do not agree with any part of these terms, you are
            prohibited from using the app.
          </p>

          <h2>2. Service Description</h2>
          <p>
            DecorAItion provides tools for generating decoration ideas, managing project timelines,
            tracking budgets, and facilitating collaboration. Our services include access to
            AI-generated design suggestions, project management features, and collaborative options.
          </p>

          <h2>3. Account Creation and Security</h2>
          <p>
            <strong>Account Requirements:</strong> You must be at least 18 years old or have
            parental consent to create an account.
          </p>
          <p>
            <strong>Account Security:</strong> You are responsible for maintaining the
            confidentiality of your account information. DecorAItion will not be liable for any loss
            or damage from unauthorized account use.
          </p>

          <h2>4. User Content and Responsibility</h2>
          <p>
            <strong>Content Ownership:</strong> You retain ownership of any designs, project data,
            or other content you upload. By uploading content, you grant DecorAItion permission to
            store, display, and process it as necessary to provide our services.
          </p>
          <p>
            <strong>User Responsibility:</strong> You agree not to use DecorAItion for unlawful
            activities, to upload harmful content, or to infringe on third-party intellectual
            property rights.
          </p>

          <h2>5. AI-Generated Content Disclaimer</h2>
          <p>
            DecorAItion offers AI-generated design suggestions. While we strive for quality, these
            suggestions are for guidance only and may not be suitable for all purposes. DecorAItion
            does not guarantee the accuracy or safety of AI-generated content.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            DecorAItion is not liable for any damages arising from your use of the app. You agree to
            indemnify and hold harmless DecorAItion and its affiliates, officers, and employees from
            any claims or damages resulting from your use of our services.
          </p>
          <h2>7. Governing Law</h2>
          <p>
            These Terms are governed by the laws of [Your Country/State]. Any disputes arising from
            these terms shall be resolved in the courts of [Jurisdiction].
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have questions regarding these terms, please contact us at
            [decoraition@gmail.com].
          </p>
        </div>
      </div>
    </div>
  );
}

export default Terms;
