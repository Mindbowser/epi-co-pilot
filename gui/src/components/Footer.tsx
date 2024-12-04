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
import { defaultModelSelector } from "../redux/selectors/modelSelectors";
import { RootState } from "../redux/store";
import { FREE_TRIAL_LIMIT_REQUESTS } from "../util/freeTrial";
import { ROUTES } from "../util/navigation";
import HeaderButtonWithToolTip from "./gui/HeaderButtonWithToolTip";
import FreeTrialProgressBar from "./loaders/FreeTrialProgressBar";
import ProfileSwitcher from "./ProfileSwitcher";
import { isNewUserOnboarding, useOnboardingCard } from "./OnboardingCard";

function Footer() {
  const navigate = useNavigate();
  const onboardingCard = useOnboardingCard();
  const { pathname } = useLocation();
  const defaultModel = useSelector(defaultModelSelector);
  const ideMessenger = useContext(IdeMessengerContext);
  const selectedProfileId = useSelector(
    (store: RootState) => store.state.selectedProfileId,
  );
  const accountEmail = useSelector(
    (state: RootState) => state.config?.accountEmail,
  );
  const configError = useSelector(
    (store: RootState) => store.state.configError,
  );

  function onClickMore() {
    navigate(pathname === ROUTES.MORE ? "/" : ROUTES.MORE);
  }

  function onClickError() {
    navigate(pathname === ROUTES.CONFIG_ERROR ? "/" : ROUTES.CONFIG_ERROR);
  }

  function onClickSettings() {
    if (selectedProfileId === "local") {
      ideMessenger.post("openConfigJson", undefined);
    } else {
      ideMessenger.post(
        "openUrl",
        `http://app.continue.dev/workspaces/${selectedProfileId}/chat`,
      );
    }
  }

  const handleAccountCLicked = () => {
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
            onClick={handleAccountCLicked} 
            style={{ cursor: 'pointer' }}
          >
            Sign In to Epico - Pilot
          </div>
        }
      </div>

      <div className="flex gap-1">
        {configError && (
          <HeaderButtonWithToolTip
            tooltipPlacement="top-end"
            text="Config error"
            onClick={onClickError}
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
          </HeaderButtonWithToolTip>
        )}

        <HeaderButtonWithToolTip
          tooltipPlacement="top-end"
          text="More"
          onClick={onClickMore}
        >
          <EllipsisHorizontalCircleIcon className="h-4 w-4" />
        </HeaderButtonWithToolTip>

        <HeaderButtonWithToolTip
          tooltipPlacement="top-end"
          onClick={onClickSettings}
          text="Configure Epico-Pilot"
        >
          <Cog6ToothIcon className="h-4 w-4" />
        </HeaderButtonWithToolTip>
      </div>
    </footer>
  );
}

export default Footer;
