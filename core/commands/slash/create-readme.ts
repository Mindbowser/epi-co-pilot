import { IDE, SlashCommand } from "../..";
import * as fs from "fs/promises";
import * as path from "path";
import ignore from "ignore";
import {
  defaultIgnoreDir,
  defaultIgnoreFile,
  gitIgArrayFromFile,
} from "../../indexing/ignore";
import { renderChatMessage } from "../../util/messageContent";

const LANGUAGE_DEP_MGMT_FILENAMES = [
  "package.json", // JavaScript (Node.js)
  "requirements.txt", // Python
  "Gemfile", // Ruby
  "pom.xml", // Java (Maven)
  "build.gradle", // Java (Gradle)
  "composer.json", // PHP
  "Cargo.toml", // Rust
  "go.mod", // Go
  "packages.config", // C# (.NET)
  "*.csproj", // C# (.NET Core)
  "pubspec.yaml", // Dart
  "Project.toml", // Julia
  "mix.exs", // Elixir
  "rebar.config", // Erlang
  "shard.yml", // Crystal
  "Package.swift", // Swift
  "dependencies.gradle", // Kotlin (when using Gradle)
  "Podfile", // Objective-C/Swift (CocoaPods)
  "*.cabal", // Haskell
  "dub.json", // D
];

const MAX_EXPLORE_DEPTH = 2;

const CreateReadmeSlashCommand: SlashCommand = {
  name: "create-readme",
  description: "Create readme file context.",
  run: async function* ({ llm, ide, input }) {
    const [workspaceDir] = await ide.getWorkspaceDirs();

    const context = await gatherProjectContext(workspaceDir, ide);
    const prompt = createReadmePrompt(context, input);

    for await (const chunk of llm.streamChat(
      [{ role: "user", content: prompt }],
      new AbortController().signal,
    )) {
      yield renderChatMessage(chunk);
    }
  },
};

async function getEntriesFilteredByIgnore(dir: string, ide: IDE) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  let ig = ignore().add(defaultIgnoreDir).add(defaultIgnoreFile);

  const gitIgnorePath = path.join(dir, ".gitignore");

  const hasIgnoreFile = await fs
    .access(gitIgnorePath)
    .then(() => true)
    .catch(() => false);

  if (hasIgnoreFile) {
    const gitIgnore = await ide.readFile(gitIgnorePath);
    const igPatterns = gitIgArrayFromFile(gitIgnore);

    ig = ig.add(igPatterns);
  }

  const filteredEntries = entries.filter((entry) => !ig.ignores(entry.name));

  return filteredEntries;
}

async function gatherProjectContext(
  workspaceDir: string,
  ide: IDE,
): Promise<string> {
  let context = "";

  async function exploreDirectory(dir: string, currentDepth: number = 0) {
    if (currentDepth > MAX_EXPLORE_DEPTH) {
      return;
    }

    const entries = await getEntriesFilteredByIgnore(dir, ide);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(workspaceDir, fullPath);

      if (entry.isDirectory()) {
        context += `\nFolder: ${relativePath}\n`;
        await exploreDirectory(fullPath, currentDepth + 1);
      } else {
        if (entry.name.toLowerCase() === "readme.md") {
          const content = await fs.readFile(fullPath, "utf-8");
          context += `README for ${relativePath}:\n${content}\n\n`;
        } else if (LANGUAGE_DEP_MGMT_FILENAMES.includes(entry.name)) {
          const content = await fs.readFile(fullPath, "utf-8");
          context += `${entry.name} for ${relativePath}:\n${content}\n\n`;
        }
      }
    }
  }

  await exploreDirectory(workspaceDir);

  return context;
}

function createReadmePrompt(context: string, input: string): string {
  return `
    Please help me generate a detailed and professional README file for my codebase. Below is the context of the codebase, including its purpose, features, setup instructions, and any other relevant information.

    Context:

     - Project Name: [Name of the project]
     - Description: [Brief description of what the project does and its purpose]
     - Technologies Used: [List of frameworks, libraries, languages, or tools]
     - Features: [Highlight the main features of the codebase]
     - Setup Instructions: [Steps for users to clone, install dependencies, and run the project]
     - Usage Instructions: [Any special instructions for using the project or running tests]
     - Contributors: [List of contributors or teams, if any]
     - License: [Specify the license type]
     - Additional Notes: [Anything extra, like future improvements, acknowledgments, or contact info]
   
    Format the README with appropriate Markdown syntax for headings, bullet points, and code blocks. Make it clear and user-friendly.
  `;
}

export default CreateReadmeSlashCommand;
