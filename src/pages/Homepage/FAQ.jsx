import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/landing.css";
import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Is my subscription account-based or device-based?",
      answer:
        "DecorAItion Planner is completely free, so there’s no subscription needed. Your account is cloud-based, meaning you can log in from any device and access your saved designs seamlessly.",
    },
    {
      question:
        "Can I use any photo for the room interior or does it need to meet certain requirements?",
      answer:
        "Yes, you can use any photo, but for the best results, we recommend clear, well-lit images with minimal obstructions like furniture or people in the frame. This helps the AI process the image more effectively.",
    },
    {
      question: "What features does the app provide for free?",
      answer:
        "DecorAItion Planner offers a variety of free features, including the ability to generate images based on your customizations, mask specific areas, and explore a wide range of design styles. You can also manage your budget, create a project timeline, and use the plan map to add pins that mark key areas or items in your design. The app supports collaboration, allowing you to share and work on designs with others, and you can download or share your final designs at no cost.",
    },
    {
      question: "How long does it take for the AI to change the room's interior?",
      answer:
        "The AI processes most requests in just a few seconds to a minute, depending on the complexity of the design and your internet speed. It’s quick and seamless!",
    },
    {
      question: "Can I share the images I create using the app on social media?",
      answer: "Yes, you can share your creations on social media to showcase your designs!",
    },
    {
      question: "Are the styles available for selection limited to a certain number?",
      answer:
        "Not at all! DecorAItion Planner provides an extensive and growing library of styles to suit your tastes. Whether you love modern, rustic, minimalistic, or eclectic designs, you’ll find something perfect for your room.",
    },
  ];

  return (
    <div
      className="faq-page"
      style={{
        background: "var(--bg-decor)",
        animation: "moveBackground 70s infinite",
        height: "92vh",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div className="center-me" style={{ margin: "24px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <IconButton
            onClick={() => navigate(navigateTo)}
            style={{
              color: "var(--color-white)",
              fontSize: "2.5rem",
              position: "absolute",
              top: "20px",
              left: "20px",
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          <h1 className="navName" style={{ fontSize: "40px" }}>
            Frequently Asked Questions
          </h1>
        </div>
        <p>You have questions, we have answers.</p>
      </div>
      <div className="faq-box">
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div key={index} className={`faq-item ${openIndex === index ? "open" : ""}`}>
              <button className="faq-question" onClick={() => toggleFaq(index)}>
                {faq.question}
                <span className="arrow">&#9660;</span>
              </button>
              <div
                className="faq-answer"
                style={{ display: openIndex === index ? "block" : "none" }}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <footer className="faq-footer">
        <img src="/img/Logo-White.png" alt="DecorAltion Icon" className="faq-decoricon" />
        <p style={{ color: "white" }}>DecorAltion</p>
      </footer>
    </div>
  );
};

export default FAQ;
