import { window } from "vscode"; // Import VS Code API
import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
} from "../../"; // Adjust this import path if necessary
import { BaseContextProvider } from "../"; // Adjust this import path if necessary
import { retrieveContextItemsFromEmbeddings } from "../retrieval/new_retrival"; // Adjust this import path if necessary

class SpecificCodebase extends BaseContextProvider {
  static description: ContextProviderDescription = {
    title: "SpecificCodebase",
    displayTitle: "SpecificCodebase",
    description: "Automatically find relevant files",
    type: "normal",
    renderInlineAs: "",
  };

  // This method will be called to retrieve context items from the codebase
  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    // Show input box to the user to input the directory path
    const userDirectory = await window.showInputBox({
      prompt: "Enter the directory path to filter code context",
      placeHolder: "e.g., src/components",
      value: "", // Default value is an empty string
      ignoreFocusOut: true, // Keeps the input box open even if the user clicks outside
    });

    // Pass the directory path (or undefined if the user cancels) to the retrieval function
    return retrieveContextItemsFromEmbeddings(
      extras, 
      { ...this.options, nRetrieve: 300, nFinal: 300 }, 
      userDirectory // The directory path provided by the user
    );
  }

  async load(): Promise<void> {
    // This method can be used for any asynchronous loading tasks
    // It's currently empty, but you can implement any setup logic if needed
  }
}

export default SpecificCodebase;
