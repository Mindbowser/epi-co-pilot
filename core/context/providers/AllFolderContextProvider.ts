import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
  ContextSubmenuItem,
  LoadSubmenuItemsArgs,
} from "../../index.js";
import {
  getBasename,
  groupByLastNPathParts,
  getUniqueFilePath,
} from "../../util/index.js";
import { BaseContextProvider } from "../index.js";
import fsPromises from "fs/promises";
import os from "os";

async function listFolders(path: string): Promise<string[]> {
    const dir = await fsPromises.readdir(path);
    const folders: string[] = [];
  
  try {
    for await (const item of dir) {
      if ((await fsPromises.stat(path + "/" + item)).isDirectory()) {
        // const innerFolders = await listFolders(path + "/" + item);
        // folders.push(...innerFolders);
        folders.push(item);
      }
    }
  } catch (err) {
    console.error(err);
  }
  return folders;
}

class AllFolderContextProvider extends BaseContextProvider {
  static description: ContextProviderDescription = {
    title: "all-folder",
    displayTitle: "All Folder",
    description: "Type to search",
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
    const folders = await listFolders(homeDir);
    const folderGroups = groupByLastNPathParts(folders, 2);
    console.log("folders", folders);
    console.log("folderGroups", folderGroups);

    return folders.map((folder) => {
      return {
        id: folder,
        title: getBasename(folder),
        description: getUniqueFilePath(folder, folderGroups),
      };
    });
  }
}

export default AllFolderContextProvider;
