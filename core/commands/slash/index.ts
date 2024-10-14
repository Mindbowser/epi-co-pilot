import GenerateTerminalCommand from "./cmd";
import CommentSlashCommand from "./comment";
import CommitMessageCommand from "./commit";
import DraftIssueCommand from "./draftIssue";
import EditSlashCommand from "./edit";
import HttpSlashCommand from "./http";
import ReviewMessageCommand from "./review";
import ShareSlashCommand from "./share";
import StackOverflowSlashCommand from "./stackOverflow";
import OnboardSlashCommand from "./onboard";
import GitAddAllCommand from "./git-add";
import GitCommitCommand from "./git-commit";
import ProjectFlowSlashCommand from "./project-flow";
import CreateReadmeSlashCommand from "./create-readme";

export default [
  DraftIssueCommand,
  ShareSlashCommand,
  StackOverflowSlashCommand,
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
];
