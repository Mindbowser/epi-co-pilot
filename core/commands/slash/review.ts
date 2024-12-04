import { ChatMessage, IDE, SlashCommand } from "../../index.js";
import * as fs from "fs/promises";
import * as path from "path";
import { stripImages } from "../../llm/images.js";
import { 
  defaultIgnoreDir, 
  defaultIgnoreFile, 
  gitIgArrayFromFile 
} from "../../indexing/ignore.js";
import ignore from "ignore";

const MAX_EXPLORE_DEPTH = 5;

const FOLDERS_TO_IGNORE = [
  '.git',
  'node_modules',
  '.vscode',
  '.idea',
  '.github',
]

const ReviewMessageCommand: SlashCommand = {
  name: "review",
  description: "Review code and give feedback",
  run: async function* ({ llm, ide, history }) {
    const [workspaceDir] = await ide.getWorkspaceDirs();
    const reviewText = getLastUserHistory(history).replace("\\review", "");
    const context = await gatherProjectContext(workspaceDir, ide);
    const prompt = createReviewPrompt(context);

    const content = `${prompt} \r\n ${reviewText ? `Please consider this chat history: ${reviewText}` : ""}`;

    for await (const chunk of llm.streamChat([
      { role: "user", content: content },
    ])) {
      yield stripImages(chunk.content);
    }
  },
};

function getLastUserHistory(history: ChatMessage[]): string {
  const lastUserHistory = history
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUserHistory) {
    return "";
  }

  if (Array.isArray(lastUserHistory.content)) {
    return lastUserHistory.content.reduce(
      (acc: string, current: { type: string; text?: string }) => {
        return current.type === "text" && current.text
          ? acc + current.text
          : acc;
      },
      "",
    );
  }

  return typeof lastUserHistory.content === "string"
    ? lastUserHistory.content
    : "";
}

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
        } else {
          const content = await fs.readFile(fullPath, "utf-8");
          context += `${entry.name} for ${relativePath}:\n${content}\n\n`;
        }
      }
    }
  }

  await exploreDirectory(workspaceDir);

  return context;
}

function createReviewPrompt(context: string): string {
  return `
    You are an expert code reviewer with extensive experience in analyzing and optimizing codebases.

    Review Focus Areas:

    1. Readability: Assess whether the code is easy to read and understand. Highlight any areas where clarity can be improved.
    2. Efficiency: Identify potential performance bottlenecks or inefficient constructs. Suggest optimizations where applicable.
    3. Best Practices: Evaluate adherence to industry standards and coding conventions. Mention any deviations and their implications.
    4. Error Handling: Check if error handling is implemented effectively. Highlight gaps and propose strategies to handle exceptions gracefully.
    5. Scalability: Analyze whether the codebase is designed to scale efficiently as the system grows in complexity or size.
    6. Documentation: Review the adequacy and quality of inline comments, documentation files, and READMEs. Suggest improvements to enhance maintainability.
    7. Security: Conduct an analysis based on OWASP guidelines and tools like MOB-SF. Identify potential vulnerabilities and recommend mitigation strategies.
    
    Deliverable:
    
    Provide a structured and detailed review, including:

     - Specific examples or excerpts from the codebase where applicable.
     - Suggestions for improvement for each focus area.
     - An overall summary of the codebase's strengths and weaknesses.
    
    
    If you identify any issues or areas of improvement, clearly outline actionable steps for resolving them.
  `;
}

export default ReviewMessageCommand;
