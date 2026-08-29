import { useEffect, useState } from "react";

/**
 * True when the app is running as an installed PWA or inside the Android
 * Trusted Web Activity wrapper used for the Google Play build.
 */
export function useStandalone() {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const check = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      // Android TWA sets this referrer, iOS Safari sets navigator.standalone
      document.referrer.startsWith("android-app://") ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setStandalone(check());
    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => setStandalone(check());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return standalone;
}
