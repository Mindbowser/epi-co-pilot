import { SlashCommand } from "../../index.js";

function commandIsPotentiallyDangerous(command: string) {
  return (
    command.includes("rm -rf") ||
    command.includes("sudo") ||
    command.includes("cd / ")
  );
}

const GitAddAllCommand: SlashCommand = {
  name: "git:add",
  description: "Stage all changes for the next commit",
  run: async function* ({ ide, llm, input }) {
    const diff = await ide.getDiff();

    if (!diff || diff.trim() === "") {
      yield "No changes detected. Make sure you are in a git repository with current changes.";
      return;
    }

    const cmd = "git add .";
    if (commandIsPotentiallyDangerous(cmd)) {
      yield "\n\nWarning: This command may be potentially dangerous. Please double-check before using it in your terminal.";
    } else {
      await ide.runCommand(cmd);
    }
  },
};

export default GitAddAllCommand;
