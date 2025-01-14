// File generated by Continue
import {
  dedent,
  dedentAndGetCommonWhitespace,
  deduplicateArray,
  getLastNPathParts,
  copyOf,
  getBasename,
  getMarkdownLanguageTagForFile,
  getRelativePath,
  getUniqueFilePath,
  groupByLastNPathParts,
  removeCodeBlocksAndTrim,
  removeQuotesAndEscapes,
  shortestRelativePaths,
  splitPath,
} from "./";

describe("getLastNPathParts", () => {
  test("returns the last N parts of a filepath with forward slashes", () => {
    const filepath = "home/user/documents/project/file.txt";
    expect(getLastNPathParts(filepath, 2)).toBe("project/file.txt");
  });

  test("returns the last N parts of a filepath with backward slashes", () => {
    const filepath = "C:\\home\\user\\documents\\project\\file.txt";
    expect(getLastNPathParts(filepath, 3)).toBe("documents/project/file.txt");
  });

  test("returns the last part if N is 1", () => {
    const filepath = "/home/user/documents/project/file.txt";
    expect(getLastNPathParts(filepath, 1)).toBe("file.txt");
  });

  test("returns the entire path if N is greater than the number of parts", () => {
    const filepath = "home/user/documents/project/file.txt";
    expect(getLastNPathParts(filepath, 10)).toBe(
      "home/user/documents/project/file.txt",
    );
  });

  test("returns an empty string if N is 0", () => {
    const filepath = "home/user/documents/project/file.txt";
    expect(getLastNPathParts(filepath, 0)).toBe("");
  });

  test("handles paths with mixed forward and backward slashes", () => {
    const filepath = "home\\user/documents\\project/file.txt";
    expect(getLastNPathParts(filepath, 3)).toBe("documents/project/file.txt");
  });

  test("handles edge case with empty filepath", () => {
    const filepath = "";
    expect(getLastNPathParts(filepath, 2)).toBe("");
  });
});

describe("deduplicateArray", () => {
  it("should return an empty array when given an empty array", () => {
    const result = deduplicateArray([], (a, b) => a === b);
    expect(result).toEqual([]);
  });

  it("should return the same array when there are no duplicates", () => {
    const input = [1, 2, 3, 4, 5];
    const result = deduplicateArray(input, (a, b) => a === b);
    expect(result).toEqual(input);
  });

  it("should remove duplicates based on the equality function", () => {
    const input = [1, 2, 2, 3, 4, 4, 5];
    const result = deduplicateArray(input, (a, b) => a === b);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("should work with objects using custom equality function", () => {
    const input = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 1, name: "Alice" },
      { id: 3, name: "Charlie" },
    ];
    const result = deduplicateArray(input, (a, b) => a.id === b.id);
    expect(result).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ]);
  });

  it("should preserve the order of items", () => {
    const input = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
    const result = deduplicateArray(input, (a, b) => a === b);
    expect(result).toEqual([3, 1, 4, 5, 9, 2, 6]);
  });

  it("should work with strings", () => {
    const input = ["apple", "banana", "apple", "cherry", "banana", "date"];
    const result = deduplicateArray(input, (a, b) => a === b);
    expect(result).toEqual(["apple", "banana", "cherry", "date"]);
  });

  it("should handle arrays with all duplicate elements", () => {
    const input = [1, 1, 1, 1, 1];
    const result = deduplicateArray(input, (a, b) => a === b);
    expect(result).toEqual([1]);
  });

  it("should work with custom equality function for complex objects", () => {
    const input = [
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ];
    const result = deduplicateArray(
      input,
      (a, b) => a.x === b.x && a.y === b.y,
    );
    expect(result).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 3, y: 4 },
    ]);
  });

  it("should handle large arrays efficiently", () => {
    const input = Array(10000)
      .fill(0)
      .map((_, i) => i % 100);
    const start = performance.now();
    const result = deduplicateArray(input, (a, b) => a === b);
    const end = performance.now();
    expect(result).toHaveLength(100);
    expect(end - start).toBeLessThan(1000); // Ensure it completes in less than 1 second
  });
});

describe("dedentAndGetCommonWhitespace", () => {
  let originalString: string;

  beforeEach(() => {
    // Setup any global variables or states if needed
    originalString = "    line1\n    line2\n    line3";
  });

  afterEach(() => {
    // Tear down any changes to global variables or states if needed
    originalString = "";
  });

  test("should dedent and return common whitespace for a simple case", () => {
    const input = "    line1\n    line2\n    line3";
    const output = dedentAndGetCommonWhitespace(input);
    expect(output).toEqual(["line1\nline2\nline3", "    "]);
  });

  test("should handle empty string", () => {
    const input = "";
    const output = dedentAndGetCommonWhitespace(input);
    expect(output).toEqual(["", ""]);
  });

  test("should handle string with only whitespace", () => {
    const input = "    ";
    const output = dedentAndGetCommonWhitespace(input);
    expect(output).toEqual(["", ""]);
  });

  test("should handle string with mixed whitespace and content", () => {
    const input = "    line1\n  line2\n    line3";
    const output = dedentAndGetCommonWhitespace(input);
    expect(output).toEqual(["  line1\nline2\n  line3", "  "]);
  });

  test("should handle string with no common leading whitespace", () => {
    const input = "line1\n  line2\n    line3";
    const output = dedentAndGetCommonWhitespace(input);
    expect(output).toEqual([input, ""]);
  });

  test("should handle string with empty lines", () => {
    const input = "    line1\n\n    line3";
    const output = dedentAndGetCommonWhitespace(input);
    expect(output).toEqual(["line1\n\nline3", "    "]);
  });

  test("should handle string with only empty lines", () => {
    const input = "\n\n";
    const output = dedentAndGetCommonWhitespace(input);
    expect(output).toEqual(["\n\n", ""]);
  });

  test("should handle string with tabs as whitespace", () => {
    const input = "\tline1\n\tline2\n\tline3";
    const output = dedentAndGetCommonWhitespace(input);
    expect(output).toEqual(["line1\nline2\nline3", "\t"]);
  });

  test("should handle string with mixed tabs and spaces", () => {
    const input = "\t    line1\n\t    line2\n\t    line3";
    const output = dedentAndGetCommonWhitespace(input);
    expect(output).toEqual(["line1\nline2\nline3", "\t    "]);
  });

  test("should handle string with different leading whitespace lengths", () => {
    const input = "    line1\n  line2\n      line3";
    const output = dedentAndGetCommonWhitespace(input);
    expect(output).toEqual(["  line1\nline2\n    line3", "  "]);
  });
});

describe("dedent function", () => {
  it("should remove common leading whitespace from all lines", () => {
    const result = dedent`
      Hello
        World
          !
    `;
    expect(result).toBe("Hello\n  World\n    !");
  });

  it("should handle strings with no indentation", () => {
    const result = dedent`Hello
World
!`;
    expect(result).toBe("Hello\nWorld\n!");
  });

  it("should handle strings with mixed indentation", () => {
    const result = dedent`
      Hello
    World
        !
    `;
    expect(result).toBe("  Hello\nWorld\n    !");
  });

  it("should remove leading and trailing empty lines", () => {
    const result = dedent`

      Hello
      World

    `;
    expect(result).toBe("Hello\nWorld");
  });

  it("should handle empty strings", () => {
    const result = dedent``;
    expect(result).toBe("");
  });

  it("should handle strings with only whitespace", () => {
    const result = dedent`
    
    `;
    expect(result).toBe("");
  });

  it("should handle interpolated values", () => {
    const world = "World";
    const result = dedent`
      Hello ${world}
        How are you?
    `;
    expect(result).toBe("Hello World\n  How are you?");
  });

  it("should handle multiple interpolated values", () => {
    const greeting = "Hello";
    const name = "Alice";
    const question = "How are you?";
    const result = dedent`
      ${greeting} ${name}
        ${question}
    `;
    expect(result).toBe("Hello Alice\n  How are you?");
  });

  it("should handle interpolated values with different indentation", () => {
    const value1 = "foo";
    const value2 = "bar";
    const result = dedent`
      ${value1}
        ${value2}
    `;
    expect(result).toBe("foo\n  bar");
  });

  it("should handle a single line with indentation", () => {
    const result = dedent`    Hello World!`;
    expect(result).toBe("Hello World!");
  });

  it("should handle a string with only one non-empty line", () => {
    const result = dedent`
      
      Hello World!
      
    `;
    expect(result).toBe("Hello World!");
  });

  it("should handle a string with Unicode characters", () => {
    const result = dedent`
      こんにちは
        世界
    `;
    expect(result).toBe("こんにちは\n  世界");
  });

  it("should handle a string with emoji", () => {
    const result = dedent`
      🌍
        🌎
          🌏
    `;
    expect(result).toBe("🌍\n  🌎\n    🌏");
  });

  it.skip("should handle a string with CRLF line endings", () => {
    const result = dedent`
      Hello\r
        World\r
    `;
    expect(result).toBe("Hello\r\n  World");
  });

  it.skip("should handle strings with tabs", () => {
    const result = dedent`
      \tHello
      \t\tWorld
      \t\t\t!
    `;
    expect(result).toBe("\tHello\n\t\tWorld\n\t\t\t!");
  });

  it("should not count empty lines in the minimum indentation", () => {
    const result = dedent`
      Hello

      World
    `;

    expect(result).toBe("Hello\n\nWorld");
  });

  it("should work with templated strings", () => {
    const language = "typescript";
    const code = "console.log('hello');\nconsole.log('world');";

    const result = dedent`
        This is the prefix of the file:
        \`\`\`${language}
        ${code}
        \`\`\``;

    expect(result).toBe(`\
This is the prefix of the file:
\`\`\`${language}
${code}
\`\`\``);
  });
});

describe("removeQuotesAndEscapes", () => {
  it("should remove surrounding double quotes and unescape characters", () => {
    const input = '"Hello \\"World\\""';
    const output = removeQuotesAndEscapes(input);
    expect(output).toBe('Hello "World"');
  });

  it("should remove surrounding single quotes and unescape characters", () => {
    const input = "'It\\'s a test'";
    const output = removeQuotesAndEscapes(input);
    expect(output).toBe("It's a test");
  });

  it("should handle smart quotes and remove them", () => {
    const input = "“Smart Quotes”";
    const output = removeQuotesAndEscapes(input);
    expect(output).toBe("Smart Quotes");
  });

  it("should remove backticks if present", () => {
    const input = "`Some code snippet`";
    const output = removeQuotesAndEscapes(input);
    expect(output).toBe("Some code snippet");
  });

  it("should handle multiple layers of quotes", () => {
    const input = "\"\"''``Nested``''\"\"";
    const output = removeQuotesAndEscapes(input);
    expect(output).toBe("Nested");
  });

  it("should handle strings without quotes", () => {
    const input = "No quotes here";
    const output = removeQuotesAndEscapes(input);
    expect(output).toBe("No quotes here");
  });

  it("should handle empty strings", () => {
    const input = "";
    const output = removeQuotesAndEscapes(input);
    expect(output).toBe("");
  });

  it("should handle strings with only escape sequences", () => {
    const input = "\\n\\t\\\\";
    const output = removeQuotesAndEscapes(input);
    expect(output).toBe("\n\t\\");
  });
});

describe("getBasename", () => {
  it("should return the base name of a Unix-style path", () => {
    const filepath = "/home/user/documents/file.txt";
    const output = getBasename(filepath);
    expect(output).toBe("file.txt");
  });

  it("should return the base name of a Windows-style path", () => {
    const filepath = "C:\\Users\\User\\Documents\\file.txt";
    const output = getBasename(filepath);
    expect(output).toBe("file.txt");
  });

  it("should handle paths with mixed separators", () => {
    const filepath = "C:/Users\\User/Documents/file.txt";
    const output = getBasename(filepath);
    expect(output).toBe("file.txt");
  });

  it("should return an empty string for empty input", () => {
    const filepath = "";
    const output = getBasename(filepath);
    expect(output).toBe("");
  });
});

describe("groupByLastNPathParts", () => {
  it("should group filepaths by their last N parts", () => {
    const filepaths = [
      "/a/b/c/d/file1.txt",
      "/x/y/z/file1.txt",
      "/a/b/c/d/file2.txt",
    ];
    const output = groupByLastNPathParts(filepaths, 2);
    expect(output).toEqual({
      "d/file1.txt": ["/a/b/c/d/file1.txt"],
      "z/file1.txt": ["/x/y/z/file1.txt"],
      "d/file2.txt": ["/a/b/c/d/file2.txt"],
    });
  });

  it("should handle an empty array", () => {
    const filepaths: string[] = [];
    const output = groupByLastNPathParts(filepaths, 2);
    expect(output).toEqual({});
  });

  it("should handle N greater than path parts", () => {
    const filepaths = ["/file.txt"];
    const output = groupByLastNPathParts(filepaths, 5);
    expect(output).toEqual({ "/file.txt": ["/file.txt"] });
  });
});

describe("getUniqueFilePath", () => {
  it("should return a unique file path within the group", () => {
    const item = "/a/b/c/file.txt";
    const itemGroups = {
      "c/file.txt": ["/a/b/c/file.txt", "/x/y/c/file.txt"],
    };
    const output = getUniqueFilePath(item, itemGroups);
    expect(output).toBe("b/c/file.txt");
  });

  it("should return the last two parts if unique", () => {
    const item = "/a/b/c/file.txt";
    const itemGroups = {
      "c/file.txt": ["/a/b/c/file.txt"],
    };
    const output = getUniqueFilePath(item, itemGroups);
    expect(output).toBe("c/file.txt");
  });

  it("should handle when additional parts are needed to make it unique", () => {
    const item = "/a/b/c/d/e/file.txt";
    const itemGroups = {
      "e/file.txt": ["/a/b/c/d/e/file.txt", "/x/y/z/e/file.txt"],
    };
    const output = getUniqueFilePath(item, itemGroups);
    expect(output).toBe("d/e/file.txt");
  });
});

describe("shortestRelativePaths", () => {
  it("should return shortest unique paths", () => {
    const paths = [
      "/a/b/c/file.txt",
      "/a/b/d/file.txt",
      "/a/b/d/file2.txt",
      "/x/y/z/file.txt",
    ];
    const output = shortestRelativePaths(paths);
    expect(output).toEqual([
      "c/file.txt",
      "d/file.txt",
      "file2.txt",
      "z/file.txt",
    ]);
  });

  it("should handle empty array", () => {
    const paths: string[] = [];
    const output = shortestRelativePaths(paths);
    expect(output).toEqual([]);
  });

  it("should handle paths with same base names", () => {
    const paths = [
      "/a/b/c/d/file.txt",
      "/a/b/c/e/file.txt",
      "/a/b/f/g/h/file.txt",
    ];
    const output = shortestRelativePaths(paths);
    expect(output).toEqual(["d/file.txt", "e/file.txt", "h/file.txt"]);
  });

  it("should handle paths where entire path is needed", () => {
    const paths = ["/a/b/c/file.txt", "/a/b/c/file.txt", "/a/b/c/file.txt"];
    const output = shortestRelativePaths(paths);
    expect(output).toEqual(["file.txt", "file.txt", "file.txt"]);
  });
});

describe("splitPath", () => {
  it("should split Unix-style paths", () => {
    const path = "/a/b/c/d/e.txt";
    const output = splitPath(path);
    expect(output).toEqual(["", "a", "b", "c", "d", "e.txt"]);
  });

  it("should split Windows-style paths", () => {
    const path = "C:\\Users\\User\\Documents\\file.txt";
    const output = splitPath(path);
    expect(output).toEqual(["C:", "Users", "User", "Documents", "file.txt"]);
  });

  it("should handle withRoot parameter", () => {
    const path = "/a/b/c/d/e.txt";
    const withRoot = "/a/b";
    const output = splitPath(path, withRoot);
    expect(output).toEqual(["b", "c", "d", "e.txt"]);
  });

  it("should handle empty path", () => {
    const path = "";
    const output = splitPath(path);
    expect(output).toEqual([""]);
  });

  it("should handle paths with multiple consecutive separators", () => {
    const path = "/a//b/c/d/e.txt";
    const output = splitPath(path);
    expect(output).toEqual(["", "a", "", "b", "c", "d", "e.txt"]);
  });
});

describe("getRelativePath", () => {
  it("should return the relative path with respect to workspace directories", () => {
    const filepath = "/workspace/project/src/file.ts";
    const workspaceDirs = ["/workspace/project"];
    const output = getRelativePath(filepath, workspaceDirs);
    expect(output).toBe("src/file.ts");
  });

  it("should return the filename if not in any workspace", () => {
    const filepath = "/other/place/file.ts";
    const workspaceDirs = ["/workspace/project"];
    const output = getRelativePath(filepath, workspaceDirs);
    expect(output).toBe("file.ts");
  });

  it("should handle multiple workspace directories", () => {
    const filepath = "/workspace2/project/src/file.ts";
    const workspaceDirs = ["/workspace/project", "/workspace2/project"];
    const output = getRelativePath(filepath, workspaceDirs);
    expect(output).toBe("src/file.ts");
  });

  it("should handle Windows-style paths", () => {
    const filepath = "C:\\workspace\\project\\src\\file.ts";
    const workspaceDirs = ["C:\\workspace\\project"];
    const output = getRelativePath(filepath, workspaceDirs);
    expect(output).toBe("src/file.ts");
  });

  it("should handle paths with spaces or special characters", () => {
    const filepath = "/workspace/project folder/src/file.ts";
    const workspaceDirs = ["/workspace/project folder"];
    const output = getRelativePath(filepath, workspaceDirs);
    expect(output).toBe("src/file.ts");
  });
});

describe("getMarkdownLanguageTagForFile", () => {
  it("should return correct language tag for known extensions", () => {
    expect(getMarkdownLanguageTagForFile("test.py")).toBe("python");
    expect(getMarkdownLanguageTagForFile("test.tsx")).toBe("tsx");
    expect(getMarkdownLanguageTagForFile("test.java")).toBe("java");
    expect(getMarkdownLanguageTagForFile("test.md")).toBe("markdown");
    expect(getMarkdownLanguageTagForFile("test.sh")).toBe("shell");
    expect(getMarkdownLanguageTagForFile("test.sql")).toBe("sql");
  });

  it("should return the extension if not in the known list", () => {
    expect(getMarkdownLanguageTagForFile("file.unknownext")).toBe("unknownext");
  });

  it("should handle filenames without extension", () => {
    expect(getMarkdownLanguageTagForFile("Makefile")).toBe("Makefile");
  });

  it("should handle filenames with multiple dots", () => {
    expect(getMarkdownLanguageTagForFile("archive.tar.gz")).toBe("gz");
  });

  it("should handle edge case with empty string as filename", () => {
    expect(getMarkdownLanguageTagForFile("")).toBe("");
  });

  it("should correctly identify files with no extensions", () => {
    expect(getMarkdownLanguageTagForFile("README")).toBe("README");
  });
});

describe("copyOf", () => {
  it("should create a deep copy of an object", () => {
    const original = { a: 1, b: { c: 2 } };
    const copied = copyOf(original);
    expect(copied).toEqual(original);
    expect(copied).not.toBe(original);
    expect(copied.b).not.toBe(original.b);
  });

  it("should handle arrays", () => {
    const original = [1, 2, { a: 3 }];
    const copied = copyOf(original);
    expect(copied).toEqual(original);
    expect(copied).not.toBe(original);
    expect(copied[2]).not.toBe(original[2]);
  });

  it("should return null for null input", () => {
    expect(copyOf(null)).toBeNull();
  });

  it("should return undefined for undefined input", () => {
    expect(copyOf(undefined)).toBeUndefined();
  });

  it("should handle objects with circular references gracefully", () => {
    // This may not be feasible with JSON.stringify – consider alternative methods like a library for deep cloning.
    const a: any = {};
    a.self = a;
    expect(() => copyOf(a)).toThrow(); // Ideally, handle circular refs before calling JSON.stringify
  });
});

describe("removeCodeBlocksAndTrim", () => {
  it("should remove code blocks from text", () => {
    const text =
      "Here is some text.\n```javascript\nconsole.log('Hello');\n```\nMore text.";
    const output = removeCodeBlocksAndTrim(text);
    expect(output).toBe("Here is some text.\n\nMore text.");
  });

  it("should remove multiple code blocks", () => {
    const text =
      "Text before.\n```code block 1```\nBetween code blocks.\n```code block 2```\nText after.";
    const output = removeCodeBlocksAndTrim(text);
    expect(output).toBe("Text before.\n\nBetween code blocks.\n\nText after.");
  });

  it("should handle text without code blocks", () => {
    const text = "No code blocks here.";
    const output = removeCodeBlocksAndTrim(text);
    expect(output).toBe("No code blocks here.");
  });

  it("should trim whitespace from the result", () => {
    const text = "   \n```code```\n   ";
    const output = removeCodeBlocksAndTrim(text);
    expect(output).toBe("");
  });
});
