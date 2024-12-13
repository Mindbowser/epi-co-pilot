import { ChatMessage, SlashCommand } from "../../index.js";
import { renderChatMessage } from "../../util/messageContent.js";

const ReviewMessageCommand: SlashCommand = {
  name: "review",
  description: "Review code and give feedback",
  run: async function* ({ llm }) {
    const prompt = createReviewPrompt();

    for await (const chunk of llm.streamChat(
      [{ role: "user", content: prompt }],
      new AbortController().signal,
    )) {
      yield renderChatMessage(chunk);
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

function createReviewPrompt(): string {
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
