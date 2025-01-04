import GenerateTerminalCommand from "./cmd";
import CommitMessageCommand from "./commit";
import DraftIssueCommand from "./draftIssue";
import HttpSlashCommand from "./http";
import OnboardSlashCommand from "./onboard";
import ReviewMessageCommand from "./review";
import ShareSlashCommand from "./share";
import GitAddAllCommand from "./git-add";
import GitCommitCommand from "./git-commit";
import ProjectFlowSlashCommand from "./project-flow";
import CreateReadmeSlashCommand from "./create-readme";
import ImpactAnalysisSlashCommand from "./impact-analysis";
import CreateCodeStatsCommand from "./code-stats";

export default [
  DraftIssueCommand,
  ShareSlashCommand,
  GenerateTerminalCommand,
  GitAddAllCommand,
  GitCommitCommand,
  HttpSlashCommand,
  CommitMessageCommand,
  ReviewMessageCommand,
  OnboardSlashCommand,
  ProjectFlowSlashCommand,
  CreateReadmeSlashCommand,
  ImpactAnalysisSlashCommand,
  CreateCodeStatsCommand,
];
