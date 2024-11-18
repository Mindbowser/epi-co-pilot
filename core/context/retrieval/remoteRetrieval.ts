import { BranchAndDir, ContextItem, ContextProviderExtras } from "../../";
import TransformersJsEmbeddingsProvider from "../../indexing/embeddings/TransformersJsEmbeddingsProvider";
import { resolveRelativePathInWorkspace } from "../../util/ideUtils";
import { getRelativePath } from "../../util/";
import { INSTRUCTIONS_BASE_ITEM } from "../providers/utils";
import { RetrievalPipelineOptions } from "./pipelines/BaseRetrievalPipeline";
import NoRerankerRetrievalPipeline from "./pipelines/NoRerankerRetrievalPipeline";
import RerankerRetrievalPipeline from "./pipelines/RerankerRetrievalPipeline";
import path from "path";
import { LanceDbIndex } from "../../indexing/LanceDbIndex";

export async function retrieveContextItemsFromRemoteLanceDb(
  extras: ContextProviderExtras,
  options: any | undefined,
  filterDirectory: string | undefined,
): Promise<ContextItem[]> {
  if (filterDirectory) {
    // Fill half of the context length, up to a max of 100 snippets
    const contextLength = extras.llm.contextLength;
    const tokensPerSnippet = 512;
    const nFinal = 512;
  
    const input = options.input ?? "";
  
    const tags: BranchAndDir[] = [{
      directory: filterDirectory,
      branch: "NONE",
    }]
  
    const index = new LanceDbIndex(extras.config.embeddingsProvider);
  
    const results = await index.retrieve(
      input,
      nFinal,
      tags,
      filterDirectory,
      true
    );
  
    if (results.length === 0) {
      console.log(
        "Warning: No results found for @codebase context provider.",
      ); 
    }
  
    return [
      {
        ...INSTRUCTIONS_BASE_ITEM,
        content:
          "Use the above code to answer the following question. You should not reference any files outside of what is shown, unless they are commonly known files, like a .gitignore or package.json. Reference the filenames whenever possible. If there isn't enough information to answer the question, suggest where the user might look to learn more.",
      },
      ...results
        .sort((a, b) => a.filepath.localeCompare(b.filepath))
        .map((r, i) => {
          console.log("result", i+1, r);
          const name = `${path.basename(r.filepath)} (${r.startLine}-${
            r.endLine
          })`;
          const description = `${r.filepath}`;
  
          if (r.filepath.includes("package.json")) {
            console.log();
          }
  
          return {
            name,
            description,
            content: `\`\`\`${name}\n${r.content}\n\`\`\``,
            uri: {
              type: "file" as const,
              value: r.filepath,
            },
          };
        }),
    ];
  } return [];
}
