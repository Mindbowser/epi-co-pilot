import {
    ContextItem,
    ContextProviderDescription,
    ContextProviderExtras,
    BranchAndDir,
  } from "../../";
  import { BaseContextProvider } from "../";
  import { retrieveContextItemsFromEmbeddings } from "../retrieval/retrieval";
  import path from "path";
  
  class CustomCodebaeContextProvider extends BaseContextProvider {
    static description: ContextProviderDescription = {
      title: "customcodebase",
      displayTitle: "customCodebase",
      description: "Find relevant files in a specific project",
      type: "normal",
      renderInlineAs: "",
    };
  
    private projectName: string;
  
    constructor(projectName: string) {
      super();
      this.projectName = projectName;
    }
  
    async getContextItems(
      query: string,
      extras: ContextProviderExtras,
    ): Promise<ContextItem[]> {
      const projectPath = await this.getProjectPath(this.projectName, extras);
      
      // Use the retrieveContextItemsFromEmbeddings function with the project path
      const options = {
        nFinal: 50,  // You can adjust these values based on your requirements
        nRetrieve: 100,
      };
  
      return retrieveContextItemsFromEmbeddings(extras, options, projectPath);
    }
  
    private async getProjectPath(projectName: string, extras: ContextProviderExtras): Promise<string> {
      const workspaceDirs = await extras.ide.getWorkspaceDirs();
      
      // Find the directory that matches the project name
      const projectDir = workspaceDirs.find(dir => path.basename(dir) === projectName);
      
      if (!projectDir) {
        throw new Error(`Project "${projectName}" not found in workspace directories.`);
      }
  
      return projectDir;
    }
  
    async load(): Promise<void> {
      // Implement any necessary loading logic for the project
    }
  }
  
  export default CustomCodebaeContextProvider;