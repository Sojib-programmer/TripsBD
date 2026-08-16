const KEY = "tripsbd.onboarded.v1";

export function hasOnboarded() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboarded() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable — treat as onboarded for this session */
  }
}
