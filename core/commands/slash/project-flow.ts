import { IDE, SlashCommand } from "../..";
import * as fs from "fs/promises";
import * as path from "path";
import { stripImages } from "../../llm/images";
import ignore from "ignore";
import {
  defaultIgnoreDir,
  defaultIgnoreFile,
  gitIgArrayFromFile,
} from "../../indexing/ignore";

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

const FOLDERS_TO_IGNORE = [
  '.git',
  'node_modules',
  '.vscode',
  '.idea',
  '.github',
]

const MAX_EXPLORE_DEPTH = 3;

const ProjectFlowSlashCommand: SlashCommand = {
  name: "project-flow",
  description: "Project Flow chart.",
  run: async function* ({ llm, ide, input }) {
    const [workspaceDir] = await ide.getWorkspaceDirs();

    const context = await gatherProjectContext(workspaceDir, ide);
    console.log("CONTEXT:", context)
    const prompt = createProjectFlowPrompt(context, input.replace(`/project-flow`, '').trim());

    for await (const chunk of llm.streamChat([
      { role: "user", content: prompt },
    ])) {
      yield stripImages(chunk.content);
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
        if (FOLDERS_TO_IGNORE.includes(relativePath)) return;
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

function createProjectFlowPrompt(context: string, input: string): string {
  return `
    You are an expert flow diagram creator in text-based flowcharts using ASCII art. Create a detailed flowchart for the project in a step-by-step manner. 
    Use the following context about the project structure, READMEs, and dependency files to create a comprehensive overview:

    ${context}
    ${!!input ? `
    Here is some additional input you may want to use:

    ${input}
    
    `: ''}
    The flowchart should include:
    - All key processes, decision points, and data flows. 
    - Be sure to label each component clearly and provide a brief description of its function. 
    - The diagram should be visually appealing and easy to understand.
    - Please generate or create the flow diagram with logical connectors using ASCII characters such as arrows (-->, |, v) and shapes like [ ] for processes, ( ) for start/end, and < > for decisions. Ensure the flowchart is easy to read and understand, with well-aligned elements.
  `;
}

export default ProjectFlowSlashCommand;
