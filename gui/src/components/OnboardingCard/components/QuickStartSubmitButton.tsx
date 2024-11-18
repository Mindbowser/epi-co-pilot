import { DEFAULT_CHAT_MODEL_CONFIG } from "core/config/default";
import { useContext } from "react";
import { useDispatch } from "react-redux";
import { Button, ButtonSubtext } from "../..";
import { IdeMessengerContext } from "../../../context/IdeMessenger";
import { setDefaultModel } from "../../../redux/slices/stateSlice";
import {
  setDialogMessage,
  setShowDialog,
} from "../../../redux/slices/uiStateSlice";
import { isJetBrains } from "../../../util";
import { useSubmitOnboarding } from "../hooks";
import JetBrainsFetchGitHubTokenDialog from "./JetBrainsFetchGitHubTokenDialog";

function QuickstartSubmitButton() {
  const ideMessenger = useContext(IdeMessengerContext);
  const dispatch = useDispatch();

  const { submitOnboarding } = useSubmitOnboarding("Quickstart");

  function onComplete() {
    submitOnboarding();

    dispatch(
      setDefaultModel({ title: DEFAULT_CHAT_MODEL_CONFIG[0].title, force: true }),
    );
  }

  function openJetBrainsDialog() {
    dispatch(setShowDialog(true));
    dispatch(
      setDialogMessage(
        <JetBrainsFetchGitHubTokenDialog onComplete={onComplete} />,
      ),
    );
  }

  async function fetchGitHubAuthToken() {
    const result = await ideMessenger.request("getGitHubAuthToken", {
      force: true,
    });

    if (result.status === "success") {
      onComplete();
    } else {
      ideMessenger.post("showToast", [
        "error",
        "Failed to sign up for Continue free trial through GitHub",
      ]);
    }
  }

  

  async function onClick() {
    const result = await ideMessenger.request("getAuthToken", null);

    if (result.status === "success") {
      onComplete();
    }
  }

  return (
    <div className="mt-4 w-full">
      <Button
        onClick={onClick}
        className="grid w-full grid-flow-col items-center gap-2"
      >
        Login with Epico
      </Button>
    </div>
  );
}

export default QuickstartSubmitButton;
