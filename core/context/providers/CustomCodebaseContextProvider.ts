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
import { getLanceDbPath } from "../../util/paths";
import lance, { Table } from "vectordb";
import * as path from 'path';

const SKIP_ABLE_FOLDERS = ["node_modules"];

async function listFolders(path: string, depth: number = 0): Promise<string[]> {
  const folders: string[] = [];

  try {
    const dir = await fsPromises.readdir(path);
    for await (const item of dir) {
      if (!item.startsWith(".") && !SKIP_ABLE_FOLDERS.includes(item) && (await fsPromises.stat(path + "/" + item)).isDirectory()) {
        if (depth > 0) {
          const innerFolders = await listFolders(path + "/" + item, depth - 1);
          innerFolders.forEach(f => folders.push(f));
        }
        folders.push(path + "/" + item);
      }
    }
  } catch (err) {
    console.error(err);
  }

  return folders;
}

class CustomCodebaseContextProvider extends BaseContextProvider {
  static description: ContextProviderDescription = {
    title: "local-codebase",
    displayTitle: "Local",
    description: "Find relevant files in a specific project that is already indexed in your local",
    type: "submenu",
    dependsOnIndexing: true,
  };

  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    const { retrieveAllContextItemsFromLanceDb } = await import(
      "../retrieval/retrievalAll.js"
    );
    return retrieveAllContextItemsFromLanceDb(extras, this.options, query);
  }

  async loadSubmenuItems(
    args: LoadSubmenuItemsArgs,
  ): Promise<ContextSubmenuItem[]> {
    const lanceDb = await lance.connect(getLanceDbPath());
    const existingLanceTables = await lanceDb.tableNames();

    
    const homeDir = os.homedir();
    const folders = await listFolders(homeDir, 3);
    const tempFolders: string[] = [];
    const requiredFolders: string[] = [];

    folders.forEach((x) => {
      if (existingLanceTables.reduce((a, f) => a || f.includes(x.replaceAll(/[/@]/g, "")), false)) {
        tempFolders.push(path.posix.join(homeDir, x));
      }
    });
  
    tempFolders.forEach((f) => {
      if (tempFolders.reduce((a, x) => a || (f.includes(x) && f !== x), false)) {
        requiredFolders.push(path.posix.join(homeDir, f));
      } else {
      }
    });

    const folderGroups = groupByLastNPathParts(requiredFolders, 2);
    
    return requiredFolders.map((folder) => {
      return {
        id: folder,
        title: getBasename(folder),
        description: getUniqueFilePath(folder, folderGroups),
      };
    });
  }
}

export default CustomCodebaseContextProvider;