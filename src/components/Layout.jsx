import { ThemeProvider } from "@mui/material/styles";
import { GlobalStyles, CssBaseline } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import defaultTheme from "../themes/defaultTheme";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSharedProps } from "../contexts/SharedPropsContext";

const Layout = ({ children }) => {
  const { user, userDoc } = useAuth();
  const { isDarkMode, setIsDarkMode } = useSharedProps();

  useEffect(() => {
    if (user && userDoc?.theme !== undefined) {
      const themeValue = Number(userDoc.theme);
      setIsDarkMode(themeValue === 0);
    }
  }, [userDoc]);

  const darkThemeStyles = {
    "--bg-header": "url('/img/bg-login.png')",
    "--bg-decor": "url('/img/decorbg.png')",
    "--bg-full": "url('/img/fullbg.png')",
    "--bg-placeholder": "url('/img/design-placeholder.png')",
    "--bg-image": "#1f1e22",
    "--color-primary": "#faa653",
    "--color-secondary": "#f04f59",
    "--color-tertiary": "#27262c",
    "--borders": "#5e5e5e",
    "--color-grey": "#9d9ca6",
    "--color-grey2": "#c1c0ce",
    "--bright-grey": "#6c6c6c",
    "--color-quaternary": "#ef4f56",
    "--color-quaternary-hover": "#df3941",
    "--errorTextBar": "#e43b44",
    "--errorText": "#ef4f56",
    "--color-white": "#fafafa",
    "--color-white-hover": "#e6e6e6",
    "--color-blue": "#0866ff",
    "--color-blue-hover": "#0050d1",
    "--color-black": "#080808",
    "--color-info-grey": "#9a9a9a",
    "--logo": "#8f5e5e",
    "--nav-card-modal": "#27262c",
    "--bgcolor": "#1f1e22",
    "--comment-capsule": "#f68950",
    "--budget-capsule": "#397438",
    "--green": "#397438",
    "--greenHover": "#225222",
    "--red": "#f14750",
    "--redHover": "#c2282f",
    "--pinkButton": "#f13681",
    "--pinkButtonHover": "#ec2073",
    "--yellowButton": "#ff9900",
    "--yellowButtonHover": "#e68a00",
    "--orangeButton": "#f15f3e",
    "--orangeButtonHover": "#e95433",
    "--inputBg": "#3e3c47",
    "--inputBgBrighter": "#4a4853",
    "--iconBg": "#302f37",
    "--iconBg2": "#36343d",
    "--iconBgHover": "#3f3d47",
    "--iconBgHover2": "#43414d",
    "--brightFont": "#ff8344",
    "--brightFontHover": "#ff9058",
    "--borderInput": "#515151",
    "--borderInputBrighter": "#646464",
    "--borderInputBrighter2": "#707070",
    "--gradientCircle": "linear-gradient(20deg, #ec2073, #ff894d)",
    "--gradientCircleDisabled": "linear-gradient(20deg, #db3074, #e78655)",
    "--gradientCircleHover": "linear-gradient(20deg, #ff894d, #ec2073)",
    "--gradientButton": "linear-gradient(90deg, #f89a47, #f15f3e, #ec2073)",
    "--gradientButtonHover": "linear-gradient(90deg, #ec2073, #f15f3e, #f89a47)",
    "--gradientFont": "linear-gradient(120deg, #faa652 0%, #f36b24 30%, #ea1179 100%)",
    "--gradientFontLessYellow": "linear-gradient(120deg, #faa652 0%, #f36b24 20%, #ea1179 100%)",
    "--gradientFontLessYellowHover":
      "linear-gradient(120deg, #faa652 0%, #f36b24 10%, #ea1179 100%)",
    "--darkGradient": "linear-gradient(#1f1e22, #1f1e22)",
    "--lightGradient": "linear-gradient(#27262c, #27262c)",
    "--gradientIcon": "linear-gradient(180deg, #f9a754, #f26b27, #ef4e59)",
    "--switchThumbGrey": "#5c5b5b",
    "--switchThumbGreyDisabled": "rgba(92, 91, 91, 0.4)",
    "--switchThumbStroke": "#ada9a9",
    "--switchThumbStrokeDisabled": "rgba(173, 169, 169, 0.4)",
    "--switchThumbCheckedDisabled": "linear-gradient(90deg, #c57f41, #b8533c, #aa3c69)",
    "--budgetCard": "#32313a",
    "--bgMain": "#1e1d21",
    "--slider": "#3c3b42",
    "--sliderHighlight": "#707070",
    "--dropdown": "#25232a",
    "--dropdownHover": "#32313a",
    "--dropdownSelected": "#3e3c47",
    "--dropdownSelectedHover": "#4a4853",
    "--dropdown2": "#32313a",
    "--dropdownHover2": "#3e3c47",
    "--dropdownSelected2": "#4a4853",
    "--dropdownSelectedHover2": "#54525e",
    "--borderLanding": "#f15f3e",
    "--landingGradientEven": "linear-gradient(270deg, #f89a47cc, #f15f3e99, #ec207300)",
    "--landingGradientOdd": "linear-gradient(90deg, #f89a47cc, #f15f3e99, #ec207300)",
    "--uib-color": "#ec2073",
    "--table-stroke": "#3e3c47",
    "--table-rows": "#27262c",
    "--table-rows-hover": "#34333b",
    "--lighterDarkBg": "#27262c",
    "--iconDark": "#525156",
    "--greyText": "#b2b2b4",
    "--greyTextDarker": "#848385",
    "--disabledButton": "#626168",
    "--disabledInput": "#3b3a42",
    "--selectImagePreview": "#4b4955",
    "--noContent": "#4b4a4d",
    "--thumbnailBorder": "#5f5c6c",
    "--thumbnailFill": "#323139",
    "--iconButtonHover": "rgba(60, 59, 66, 0.3)",
    "--iconButtonActive": "rgba(60, 59, 66, 0.5)",
    "--iconButtonHover2": "rgba(112, 111, 119, 0.3)",
    "--iconButtonActive2": "rgba(112, 111, 119, 0.5)",
    "--topInfoGradient":
      "linear-gradient(to top, rgba(39, 38, 44, 0), rgba(39, 38, 44, 0.3), rgba(39, 38, 44, 0.9))",
    "--yellow": "#fec269",
    "--optional": "#88888b",
    "--addMask": "#00ff40",
    "--removeMask": "#ff0000",
    "--samMask": "#7543ff",
    "--always-white": "#ffffff",
  };

  const lightThemeStyles = {
    "--bg-header": "url('/img/bg-white.png')",
    "--bg-decor": "url('/img/decorbglight.png')",
    "--bg-full": "url('/img/fullbg.png')",
    "--bg-placeholder": "url('/img/design-placeholder-dark.png')",
    "--bg-image": "#ffffff",
    "--color-primary": "#faa653",
    "--color-secondary": "#ff6347",
    "--color-tertiary": "#f0f0f0",
    "--borders": "#5e5e5e",
    "--color-grey": "#666666",
    "--color-grey2": "#c1c0ce",
    "--bright-grey": "#afaeae",
    "--color-quaternary": "#ef4f56",
    "--color-quaternary-hover": "#df3941",
    "--errorTextBar": "#e43b44",
    "--errorText": "#ef4f56",
    "--color-white": "#0a0a0a",
    "--color-white-hover": "#181818",
    "--color-blue": "#0866ff",
    "--color-blue-hover": "#0050d1",
    "--color-black": "#f8f8f8",
    "--color-info-grey": "#9a9a9a",
    "--logo": "#8f5e5e",
    "--nav-card-modal": "#ffffff",
    "--bgcolor": "#e7e7e7",
    "--comment-capsule": "#f68950",
    "--budget-capsule": "#2c8b2a",
    "--green": "#397438",
    "--greenHover": "#225222",
    "--red": "#f14750",
    "--redHover": "#c2282f",
    "--pinkButton": "#f13681",
    "--pinkButtonHover": "#ec2073",
    "--yellowButton": "#ff9900",
    "--yellowButtonHover": "#e68a00",
    "--orangeButton": "#f15f3e",
    "--orangeButtonHover": "#e95433",
    "--inputBg": "#f0f0f0",
    "--inputBgBrighter": "#f3f3f3",
    "--iconBg": "#fafafa",
    "--iconBg2": "#f0f0f0",
    "--iconBgHover": "#e4e4e4",
    "--iconBgHover2": "#dbd9d9",
    "--brightFont": "#ff7a28",
    "--brightFontHover": "#f36b25",
    "--borderInput": "#515151",
    "--borderInputBrighter": "#646464",
    "--borderInputBrighter2": "#707070",
    "--gradientCircle": "linear-gradient(20deg, #ec2073, #ff894d)",
    "--gradientCircleDisabled": "linear-gradient(20deg, #db3074, #e78655)",
    "--gradientCircleHover": "linear-gradient(20deg, #ff894d, #ec2073)",
    "--gradientButton": "linear-gradient(90deg, #f89a47, #f15f3e, #ec2073)",
    "--gradientButtonHover": "linear-gradient(90deg, #ec2073, #f15f3e, #f89a47)",
    "--gradientFont": "linear-gradient(120deg, #faa652 0%, #f36b24 30%, #ea1179 100%)",
    "--gradientFontLessYellow": "linear-gradient(120deg, #faa652 0%, #f36b24 20%, #ea1179 100%)",
    "--gradientFontLessYellowHover":
      "linear-gradient(120deg, #faa652 0%, #f36b24 10%, #ea1179 100%)",
    "--darkGradient": "linear-gradient(#ffffff, #ffffff)",
    "--lightGradient": "linear-gradient(#e0e0e0, #e0e0e0)",
    "--gradientIcon": "linear-gradient(180deg, #f9a754, #f26b27, #ef4e59)",
    "--switchThumbGrey": "#5c5b5b",
    "--switchThumbGreyDisabled": "rgba(92, 91, 91, 0.4)",
    "--switchThumbStroke": "#ada9a9",
    "--switchThumbStrokeDisabled": "rgba(173, 169, 169, 0.4)",
    "--switchThumbCheckedDisabled": "linear-gradient(90deg, #c57f41, #b8533c, #aa3c69)",
    "--budgetCard": "#bcbac5",
    "--bgMain": "#e9e8ec",
    "--slider": "#aaaaaa",
    "--sliderHighlight": "#cccccc",
    "--dropdown": "#e0e0e0",
    "--dropdownHover": "#f0f0f0",
    "--dropdownSelected": "#d0d0d0",
    "--dropdownSelectedHover": "#c2c2c2",
    "--dropdown2": "#d6d6d6",
    "--dropdownHover2": "#c9c9c9",
    "--dropdownSelected2": "#b9b9b9",
    "--dropdownSelectedHover2": "#b1b1b1",
    "--borderLanding": "#f15f3e",
    "--landingGradientEven": "linear-gradient(270deg, #f89a47cc, #f15f3e99, #ec207300)",
    "--landingGradientOdd": "linear-gradient(90deg, #f89a47cc, #f15f3e99, #ec207300)",
    "--uib-color": "#ec2073",
    "--table-stroke": "#9f9f9f",
    "--table-rows": "#e9e8ec",
    "--table-rows-hover": "#d2d1d6",
    "--lighterDarkBg": "#e4e4e4",
    "--iconDark": "#525156",
    "--greyText": "#676767",
    "--greyTextDarker": "#575757",
    "--disabledButton": "#aaaaaa",
    "--disabledInput": "#aaaaaa",
    "--selectImagePreview": "#9e9e9e",
    "--noContent": "#4b4a4d",
    "--thumbnailBorder": "#5f5c6c",
    "--thumbnailFill": "#f3f3f3",
    "--iconButtonHover": "rgba(238, 238, 238, 0.3)",
    "--iconButtonActive": "rgba(238, 238, 238, 0.5)",
    "--iconButtonHover2": "rgba(228, 228, 228, 0.3)",
    "--iconButtonActive2": "rgba(228, 228, 228, 0.5)",
    "--topInfoGradient":
      "linear-gradient(to top, rgba(228, 228, 228, 0), rgba(228, 228, 228, 0.3), rgba(228, 228, 228, 0.9))",
    "--yellow": "#fec269",
    "--optional": "#88888b",
    "--addMask": "#00ff40",
    "--removeMask": "#ff0000",
    "--samMask": "#7543ff",
    "--always-white": "#ffffff",
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <GlobalStyles styles={{ ":root": isDarkMode ? darkThemeStyles : lightThemeStyles }} />
      <ToastContainer progressStyle={{ backgroundColor: "var(--brightFont)" }} />
      {children}
    </ThemeProvider>
  );
};

export default Layout;
