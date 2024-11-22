import { useEffect, useState } from "react";

export const usePreventNavigation = (isLoading, showNavigationDialog) => {
  useEffect(() => {
    let initialPath = window.location.pathname;

    const handleBeforeUnload = (e) => {
      if (isLoading) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    const handlePopState = (e) => {
      if (isLoading) {
        e.preventDefault();
        window.history.pushState(null, "", initialPath);
        showNavigationDialog(true);
      }
    };

    // Push initial state
    window.history.pushState(null, "", initialPath);

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isLoading, showNavigationDialog]);
};
