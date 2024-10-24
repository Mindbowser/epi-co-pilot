import { getLocalStorage, setLocalStorage } from "../../util/localStorage";
import { OnboardingCardState } from "./OnboardingCard";

// Note that there is no "NotStarted" status since the
// local storage value is null until onboarding begins
export type OnboardingStatus = "Started" | "Completed";

// If there is no value in local storage for "onboardingStatus",
// it implies that the user has not begun or completed onboarding.
export function isNewUserOnboarding() {
  const isLoggedIn = getLocalStorage("isLoggedIn");

  if (!isLoggedIn) {
    setLocalStorage("inputHistory", null);
    setLocalStorage("onboardingStatus", "Started");
    setLocalStorage("hasDismissedOnboardingCard", false);
    setLocalStorage("isLoggedIn", false);
  }

  const onboardingStatus = getLocalStorage("onboardingStatus");

  return onboardingStatus === undefined;
}

export const defaultOnboardingCardState: OnboardingCardState = {
  show: false,
  activeTab: "Quickstart",
};

export enum OllamaConnectionStatuses {
  WaitingToDownload = "WaitingToDownload",
  Downloading = "Downloading",
  Connected = "Connected",
}
