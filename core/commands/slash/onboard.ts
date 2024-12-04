import * as fs from "fs/promises";
import * as path from "path";

import ignore from "ignore";

import { IDE, SlashCommand } from "../..";
import {
  defaultIgnoreDir,
  defaultIgnoreFile,
  gitIgArrayFromFile,
} from "../../indexing/ignore";
import { stripImages } from "../../llm/images";

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
  As a helpful AI assistant, your role is to provide an insightful and structured overview of this codebase to help onboard a new developer. Use the provided context about the project structure, READMEs, and dependency files to generate a detailed summary:
  ${context}

  Please provide an overview of the project with the following guidelines:

  1. Important Folders

   - Identify the critical folders in the project and explain their purpose.
   - Highlight key packages or technologies used within these folders.
   - Summarize relevant details from README files or configuration files like package.json.
  
  2. Project Architecture

   - Provide a high-level overview of how different parts of the codebase fit together.
   - Describe the overall architecture (e.g., monolithic, microservices) and design patterns (e.g., MVC, Singleton).
   - List major third-party libraries and their roles within the project.
  
  3. Coding Style

   - Summarize the project's coding standards, including formatting, naming conventions, code structure, and documentation practices.
   - Highlight approaches to error handling and testing standards.
  
  4. UI Frameworks

   - Explain how UI frameworks are utilized in the project.
   - Describe specific use cases and the rationale for using frameworks like MUI, Bootstrap, or Tailwind CSS.
  
  5.  Environment Configurations

   - Detail how environment configurations are managed, including where they are stored and how they are accessed in the codebase.
  
  6. Additional Architectural Insights

   - Provide up to five additional insights about the architecture, such as scalability strategies, CI/CD pipelines, or performance optimizations.
  
  7. Unit Testing and Coverage

   - Mention the testing framework(s) used and the approach to ensure sufficient test coverage.
   - Highlight strategies for maintaining code quality through testing.
  
  8. How to Run the Project

   - Include step-by-step instructions for setting up the project, running it locally, and accessing key functionalities.
  
  
  Example Response Format:

  1. Important Folders

   - /src: Contains core application logic, including API handlers and business logic.
   - Key Packages: Express for routing, Sequelize for database interactions.
   - /public: Houses static assets like images and CSS files.
   - /config: Stores configuration files, including environment-specific settings.
  
  2. Project Architecture

   - Frontend: Built with React, uses Redux for state management.
   - Backend: Node.js application following an MVC architecture.
   - Design Patterns: Implements Repository pattern for database operations.
   - Key Libraries: Axios for HTTP requests, Lodash for utility functions.
  
  3. Coding Style

   - The project adheres to [Airbnb JavaScript Style Guide] with Prettier for formatting.
   - Variables follow camelCase conventions; components are PascalCase.
  
  4. UI Frameworks

   - Bootstrap is used for rapid prototyping and layout grids.
   - Tailwind CSS provides flexibility for custom styles.
  
  5. Environment Configurations

   - Stored in .env files. Utilizes dotenv to load variables.
  
  6.  Additional Insights

   - CI/CD: Automated testing and deployment with GitHub Actions.
   - TypeScript: Enforces static typing for improved reliability.
  
  7. Unit Testing and Coverage

   - Framework: Jest for backend, React Testing Library for frontend.
   - Goal: 90% coverage for critical modules.
  
  8. How to Run the Project

   - Install dependencies: npm install.
   - Start the server: npm start.
   - Access at http://localhost:3000.
  
  This format ensures the developer has a clear, detailed understanding of both the specifics of each component and the overall structure of the project.  
  `;
}

export default OnboardSlashCommand;
