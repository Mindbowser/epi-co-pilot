import { ChatMessage, SlashCommand } from "../../index.js";
import { stripImages } from "../../llm/images.js";

const prompt = `
Please review the following code, considering these aspects:

Readability: Is the code easy to understand?
Efficiency: Are there any performance concerns?
Best practices: Does the code follow industry standards and best practices?
Error handling: Is error handling implemented appropriately?
Scalability: Will the code perform well as the system grows?
Documentation: Is the code adequately commented and documented?`;

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

const ReviewMessageCommand: SlashCommand = {
  name: "review",
  description: "Review code and give feedback",
  run: async function* ({ llm, history }) {
    const reviewText = getLastUserHistory(history).replace("\\review", "");

    const content = `${prompt} \r\n ${reviewText}`;

    for await (const chunk of llm.streamChat([
      { role: "user", content: content },
    ])) {
      yield stripImages(chunk.content);
    }
  },
};

export default ReviewMessageCommand;
