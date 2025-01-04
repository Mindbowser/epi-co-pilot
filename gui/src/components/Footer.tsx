import {
  Cog6ToothIcon,
  EllipsisHorizontalCircleIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useContext } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { IdeMessengerContext } from "../context/IdeMessenger";
import { RootState } from "../redux/store";
import { FREE_TRIAL_LIMIT_REQUESTS } from "../util/freeTrial";
import FreeTrialProgressBar from "./loaders/FreeTrialProgressBar";
import ProfileSwitcher from "./ProfileSwitcher";
import { isNewUserOnboarding, useOnboardingCard } from "./OnboardingCard";
import { ROUTES } from "../util/navigation";
import HeaderButtonWithToolTip from "./gui/HeaderButtonWithToolTip";

function Footer() {
  const navigate = useNavigate();
  const onboardingCard = useOnboardingCard();
  const accountEmail = useSelector(
    (state: RootState) => state.config?.accountEmail,
  );

  const handleAccountClicked = () => {
    if (!accountEmail) {
      isNewUserOnboarding();
      onboardingCard.open("Quickstart");
      navigate("/");
    }
  } 

  return (
    <footer className="flex h-7 items-center justify-between overflow-hidden border-0 border-t border-solid border-t-zinc-700 p-2">
      <div className="flex max-w-[40vw] gap-2">
        <ProfileSwitcher />
        
        {accountEmail ? (
          <HeaderButtonWithToolTip
            tooltipPlacement="top-end"
            text={`Logged in as ${accountEmail}`}
          >
            <UserCircleIcon className="h-4 w-4" />
          </HeaderButtonWithToolTip>
          ) : 
          <div 
            onClick={handleAccountClicked} 
            style={{ cursor: 'pointer' }}
          >
            Sign In to Epico - Pilot
          </div>
        }
      </div>
    </footer>
  );
}

export default Footer;
