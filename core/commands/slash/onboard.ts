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

const MAX_EXPLORE_DEPTH = 2;

const OnboardSlashCommand: SlashCommand = {
  name: "onboard",
  description: "Familiarize yourself with the codebase",
  run: async function* ({ llm, ide }) {
    const [workspaceDir] = await ide.getWorkspaceDirs();

    const context = await gatherProjectContext(workspaceDir, ide);
    const prompt = createOnboardingPrompt(context);

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

function createOnboardingPrompt(context: string): string {
  return `
  As a helpful AI assistant, your task is to onboard a new developer to this project. Use the following context about the project structure, READMEs, and dependency files to create a comprehensive overview: ${context}
  ${context}
  Please provide an overview of the project with the following guidelines:

  Important Folders: Identify the most critical folders in the project (up to 10) and explain each one step-by-step:

  Describe the primary purpose of each folder, summarizing relevant README or package.json information, if available.
  Mention the most popular or common packages in each folder and their roles.
  Project Architecture: After covering individual folders, provide at most 5 high-level insights on the architecture:

  Explain how different parts of the codebase fit together.
  Describe the overall architecture or design patterns used (such as MVC, Singleton, or Factory), as evident from the folder structure and dependencies.
  Third-Party Libraries: List the main third-party libraries used and summarize their roles.

  Unit Testing and Coverage: Mention the unit testing framework (if any) and describe the test coverage strategy to ensure code quality.

  Coding Style: Provide an overview of the project's coding style, covering:

  Formatting standards, naming conventions, code structure, documentation practices, error handling, and testing standards.
  UI Frameworks: Describe how the UI frameworks are used in the project:

  Explain the specific use cases and distinctions between MUI, Bootstrap, and Tailwind CSS, and why each one is selected in different contexts.
  How to Run the Project: Offer detailed instructions for setting up the project environment, running the code, and essential commands to run the project successfully.

  Environment Configurations: Describe the environment configurations in the project and explain how they are typically stored and accessed.

  Additional Architecture Insights: Provide at most 5 additional architectural insights that weren't covered in the folder-by-folder breakdown.

  Your response should be structured, clear, and focused on giving the new developer both a detailed understanding of individual components and a high-level overview of the project as a whole.

  Here is an example of a valid response:

  Important folders
  /folder1
  Description: Contains the main application logic.
  Key packages: Express.js for routing, Mongoose for database operations.
  /folder1/folder2
  Project Architecture
  Frontend: Built using React and Redux for state management.
  Backend: A Node.js application using Express.js for routing and Mongoose for database operations.
  Architecture Pattern: Follows a Model-View-Controller (MVC) architecture.
  Design Patterns: Utilizes MVC with a Singleton pattern for database connections.
  Third-Party Libraries
  Libraries: Express for server routing, Mongoose for database manipulation, and Axios for API requests.
  Unit Testing and Coverage
  Framework: Uses Jest for unit testing, with a goal of 80% code coverage on core components.
  Coding Style
  Overview: The project follows [coding conventions] for formatting, naming, and documentation. Standards for error handling and testing are outlined to ensure code consistency and maintainability.
  UI Frameworks
  Use Cases: MUI is used for material design components, Bootstrap for quick, responsive layouts, and Tailwind CSS for custom utility styling.
  How to Run the Project
  Instructions: Set up the environment with [specific commands] and run [project entry points] to start the application.
  Environment Configurations
  Overview: Environment variables are stored in a .env file, managing different configurations for development, testing, and production.
  Additional Insights
  Structure: The project follows a monorepo layout.
  Type Safety: TypeScript is implemented to enhance code reliability.
  This format ensures the developer has a clear, detailed understanding of both the specifics of each component and the overall structure of the project.  
  `;
}

export default OnboardSlashCommand;
