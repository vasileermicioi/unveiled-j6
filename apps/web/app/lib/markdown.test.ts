import { describe, expect, test } from "bun:test";

import { markdownToPlainText } from "./markdown";

describe("markdownToPlainText", () => {
  test("strips headings to readable text", () => {
    expect(markdownToPlainText("# Welcome\n\n## Details")).toBe("Welcome Details");
    expect(markdownToPlainText("# Welcome")).not.toContain("#");
  });

  test("strips emphasis markers", () => {
    expect(markdownToPlainText("This is **bold** and *italic*.")).toBe("This is bold and italic.");
    expect(markdownToPlainText("~~struck~~")).toBe("struck");
    expect(markdownToPlainText("**bold**")).not.toContain("**");
  });

  test("uses link labels without URL syntax", () => {
    expect(markdownToPlainText("See [our site](https://example.com) today.")).toBe(
      "See our site today.",
    );
    expect(markdownToPlainText("[label](https://example.com)")).not.toContain("https://");
  });

  test("strips list markers", () => {
    const input = ["Intro", "", "- first", "- second", "", "1. one", "2. two"].join("\n");
    const result = markdownToPlainText(input);
    expect(result).toBe("Intro first second one two");
    expect(result).not.toMatch(/^\s*[-*+]/m);
    expect(result).not.toMatch(/\d+\./);
  });

  test("normalizes whitespace and handles empty input", () => {
    expect(markdownToPlainText("  hello   \n\n  world  ")).toBe("hello world");
    expect(markdownToPlainText("")).toBe("");
  });
});
