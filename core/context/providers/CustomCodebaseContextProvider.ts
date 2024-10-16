import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
  LoadSubmenuItemsArgs,
  ContextSubmenuItem,
} from "../../";
import { BaseContextProvider } from "../index.js";
import fsPromises from "fs/promises";
import os from "os";
import { getBasename, getUniqueFilePath, groupByLastNPathParts } from "../../util";

async function listFolders(path: string, depth: number = 0): Promise<string[]> {
  const dir = await fsPromises.readdir(path);
  const folders: string[] = [];

try {
  for await (const item of dir) {
    if ((await fsPromises.stat(path + "/" + item)).isDirectory()) {
      if (depth > 0) {
        const innerFolders = await listFolders(path + "/" + item, depth - 1);
        folders.push(...innerFolders);
      }
      folders.push(item);
    }
  }
} catch (err) {
  console.error(err);
}
return folders;
}

class CustomCodebaseContextProvider extends BaseContextProvider {
  static description: ContextProviderDescription = {
    title: "custom-codebase",
    displayTitle: "Custom Codebase",
    description: "Find relevant files in a specific project",
    type: "submenu",
    dependsOnIndexing: true,
  };

  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    const { retrieveContextItemsFromEmbeddings } = await import(
      "../retrieval/retrieval.js"
    );
    return retrieveContextItemsFromEmbeddings(extras, this.options, query);
  }

  async loadSubmenuItems(
    args: LoadSubmenuItemsArgs,
  ): Promise<ContextSubmenuItem[]> {
    const homeDir = os.homedir();
    const folders = await listFolders(homeDir, 5);
    const folderGroups = groupByLastNPathParts(folders, 2);

    return folders.map((folder) => {
      return {
        id: folder,
        title: getBasename(folder),
        description: getUniqueFilePath(folder, folderGroups),
      };
    });
  }
}

export default CustomCodebaseContextProvider;