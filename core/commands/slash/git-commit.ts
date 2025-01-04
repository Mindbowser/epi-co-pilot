import { SlashCommand } from "../../index.js";

function commandIsPotentiallyDangerous(command: string) {
  return (
    command.includes("rm -rf") ||
    command.includes("sudo") ||
    command.includes("cd / ")
  );
}

const GitCommitCommand: SlashCommand = {
  name: "git:commit",
  description: "Commit changes with a custom message",
  run: async function* ({ ide, llm, input }) {
    const diff = await ide.getDiff(false);

    if (!diff) {
      yield "No changes detected. Make sure you are in a git repository with current changes.";
      return;
    }

    const cmd = `git commit -m ${input}`;
    if (commandIsPotentiallyDangerous(cmd)) {
      yield "\n\nWarning: This command may be potentially dangerous. Please double-check before using it in your terminal.";
    } else {
      await ide.runCommand(cmd);
    }
  },
};

export default GitCommitCommand;
