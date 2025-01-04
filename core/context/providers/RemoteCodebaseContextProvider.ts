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
import { getLanceDbPath, getRemoteLanceDbPath } from "../../util/paths";
import lance, { Table } from "vectordb";

const SKIP_ABLE_FOLDERS = ["node_modules"];
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

async function listFolders(path: string, depth: number = 0): Promise<string[]> {
  const folders: string[] = [];

  const dir = await fsPromises.readdir(path);
  try {
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
    title: "remote-codebase",
    displayTitle: "Global",
    description: "Find relevant files a remote server",
    type: "submenu",
    dependsOnIndexing: true,
  };

  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    const { retrieveContextItemsFromRemoteLanceDb } = await import(
      "../retrieval/remoteRetrieval.js"
    );
    return retrieveContextItemsFromRemoteLanceDb(extras, this.options, query);
  }

  async loadSubmenuItems(
    args: LoadSubmenuItemsArgs,
  ): Promise<ContextSubmenuItem[]> {
    const uri = getRemoteLanceDbPath();
    if (uri && AWS_SECRET_KEY && AWS_ACCESS_KEY_ID) {
      const lanceDb = await lance.connect({
        uri,
        awsRegion: "ap-south-1",
        awsCredentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretKey: AWS_SECRET_KEY,
        }
      });
      const existingLanceTables = await lanceDb.tableNames();
      return [{
        id: "all",
        title: "All remote projects",
        description: "",
      },...existingLanceTables.map((folder) => {
        return {
          id: folder,
          title: getBasename(folder),
          description: "",
        };
      })];
    }
    return [];
  }
}

export default CustomCodebaseContextProvider;