import {
  ContextProviderWithParams,
  ModelDescription,
  SerializedContinueConfig,
  SlashCommandDescription,
} from "../";

export const DEFAULT_CHAT_MODEL_CONFIG: ModelDescription = {
  "model": "llama3.2",
  "provider": "ollama",
  "apiBase": "https://apparently-vital-mutt.ngrok-free.app/",
  "title": "MB"
};

export const DEFAULT_AUTOCOMPLETE_MODEL_CONFIG: ModelDescription = {
  "title": "Tab Autocomplete Model",
  "provider": "ollama",
  "model": "llama3.2",
  "apiBase": "https://apparently-vital-mutt.ngrok-free.app/"
};

export const FREE_TRIAL_MODELS: ModelDescription[] = [
  {
    title: "Claude 3.5 Sonnet (Free Trial)",
    provider: "free-trial",
    model: "claude-3-5-sonnet-20240620",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "GPT-4o (Free Trial)",
    provider: "free-trial",
    model: "gpt-4o",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "Llama3.1 70b (Free Trial)",
    provider: "free-trial",
    model: "llama3.1-70b",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "Codestral (Free Trial)",
    provider: "free-trial",
    model: "codestral-latest",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
];

export const defaultContextProvidersVsCode: ContextProviderWithParams[] = [
  { name: "code", params: {} },
  { name: "docs", params: {} },
  { name: "diff", params: {} },
  { name: "terminal", params: {} },
  { name: "problems", params: {} },
  { name: "folder", params: {} },
  { name: "all-folder", params: {} },
  { name: "codebase", params: {} },
];

export const defaultContextProvidersJetBrains: ContextProviderWithParams[] = [
  { name: "diff", params: {} },
  { name: "folder", params: {} },
  { name: "codebase", params: {} },
];

export const defaultSlashCommandsVscode: SlashCommandDescription[] = [
  {
    name: "edit",
    description: "Edit selected code",
  },
  {
    name: "comment",
    description: "Write comments for the selected code",
  },
  {
    name: "share",
    description: "Export the current chat session to markdown",
  },
  {
    name: "cmd",
    description: "Generate a shell command",
  },
  {
    name: "git:add",
    description: "Stage all changes for the next commit",
  },
  {
    name: "git:commit",
    description: "Commit changes with a custom message",
  },
  {
    name: "commit",
    description: "Generate a git commit message",
  },
  {
    name: "review",
    description: "Review code and give feedback",
  },
  {
    name: "onboard",
    description: "Familiarize yourself with the codebase",
  },
  {
    name: "project-flow",
    description: "Project Flow chart.",
  },
  {
    name: "create-readme",
    description: "Create readme file context.",
  }
];

export const defaultSlashCommandsJetBrains = [
  {
    name: "edit",
    description: "Edit selected code",
  },
  {
    name: "comment",
    description: "Write comments for the selected code",
  },
  {
    name: "share",
    description: "Export the current chat session to markdown",
  },
  {
    name: "commit",
    description: "Generate a git commit message",
  },
];

export const defaultConfig: SerializedContinueConfig = {
  models: [DEFAULT_CHAT_MODEL_CONFIG],
  tabAutocompleteModel: DEFAULT_AUTOCOMPLETE_MODEL_CONFIG,
  customCommands: [
    {
      name: "test",
      prompt:
        "{{{ input }}}\n\nWrite a comprehensive set of unit tests for the selected code. It should setup, run tests that check for correctness including important edge cases, and teardown. Ensure that the tests are complete and sophisticated. Give the tests just as chat output, don't edit any file.",
      description: "Write unit tests for highlighted code",
    },
  ],
  contextProviders: defaultContextProvidersVsCode,
  slashCommands: defaultSlashCommandsVscode,
};

export const defaultConfigJetBrains: SerializedContinueConfig = {
  models: [DEFAULT_CHAT_MODEL_CONFIG],
  tabAutocompleteModel: DEFAULT_AUTOCOMPLETE_MODEL_CONFIG,
  customCommands: [
    {
      name: "test",
      prompt:
        "{{{ input }}}\n\nWrite a comprehensive set of unit tests for the selected code. It should setup, run tests that check for correctness including important edge cases, and teardown. Ensure that the tests are complete and sophisticated. Give the tests just as chat output, don't edit any file.",
      description: "Write unit tests for highlighted code",
    },
  ],
  contextProviders: defaultContextProvidersJetBrains,
  slashCommands: defaultSlashCommandsJetBrains,
};
