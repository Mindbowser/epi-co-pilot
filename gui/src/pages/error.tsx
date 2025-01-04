import { useDispatch } from "react-redux";
import { useNavigate, useRouteError } from "react-router-dom";
import { newSession } from "../redux/slices/sessionSlice";
import { GithubIcon } from "../components/svg/GithubIcon";
import { DiscordIcon } from "../components/svg/DiscordIcon";
import { useContext, useEffect, useState } from "react";
import { IdeMessengerContext } from "../context/IdeMessenger";
import { Button, SecondaryButton } from "../components";
import { ArrowPathIcon, FlagIcon } from "@heroicons/react/24/outline";

const GITHUB_LINK = "https://github.com/continuedev/continue/issues/new/choose";
const DISCORD_LINK = "https://discord.com/invite/EfJEfdFnDQ";

const ErrorPage: React.FC = () => {
  const error: any = useRouteError();
  console.error(error);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const messenger = useContext(IdeMessengerContext);
  const openUrl = (url: string) => {
    if (messenger) {
      messenger.post("openUrl", url);
    }
  };

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setInitialLoad(false);
    }, 500);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center px-2 py-4 text-center sm:px-8">
      <h1 className="mb-4 text-3xl font-bold">Oops! Something went wrong</h1>

      <code className="whitespace-wrap mx-2 mb-4 max-w-full break-words py-2">
        {error.statusText || error.message}
      </code>
    </div>
  );
};

export default ErrorPage;
