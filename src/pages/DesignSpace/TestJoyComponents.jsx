import React from "react";
import { CssVarsProvider } from "@mui/joy/styles";
import Button from "@mui/joy/Button";
import Slider from "@mui/joy/Slider";
import Textarea from "@mui/joy/Textarea";

function TestJoyComponents() {
  return (
    <CssVarsProvider>
      <div>
        <h1>Testing Joy UI Components</h1>
        <Button>Joy Button</Button>
        <Slider defaultValue={50} />
        <Textarea placeholder="Joy Textarea" />
      </div>
    </CssVarsProvider>
  );
}

export default TestJoyComponents;
