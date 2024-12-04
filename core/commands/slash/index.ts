import GenerateTerminalCommand from "./cmd";
import CommitMessageCommand from "./commit";
import DraftIssueCommand from "./draftIssue";
import HttpSlashCommand from "./http";
import MultiFileEditSlashCommand from "./multifileEdit";
import ReviewMessageCommand from "./review";
import ShareSlashCommand from "./share";
import OnboardSlashCommand from "./onboard";
import GitAddAllCommand from "./git-add";
import GitCommitCommand from "./git-commit";
import ProjectFlowSlashCommand from "./project-flow";
import CreateReadmeSlashCommand from "./create-readme";
import ImpactAnalysisSlashCommand from "./impact-analysis";
import EditSlashCommand from "./edit";
import CommentSlashCommand from "./comment";
import CreateCodeStatsCommand from "./code-stats";

export default [
  DraftIssueCommand,
  ShareSlashCommand,
  GenerateTerminalCommand,
  EditSlashCommand,
  CommentSlashCommand,
  GitAddAllCommand,
  GitCommitCommand,
  HttpSlashCommand,
  CommitMessageCommand,
  ReviewMessageCommand,
  OnboardSlashCommand,
  ProjectFlowSlashCommand,
  CreateReadmeSlashCommand,
  ImpactAnalysisSlashCommand,
  MultiFileEditSlashCommand,,
  CreateCodeStatsCommand,
];
