import { ApprovalRequestId } from "@t3tools/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import { ComposerPendingApprovalPanel } from "./ComposerPendingApprovalPanel";

describe("ComposerPendingApprovalPanel", () => {
  it("renders complete multiline command details without hover or truncation", () => {
    const detail = `bun run release -- ${"x".repeat(500)}\nsecond line`;
    const markup = renderToStaticMarkup(
      <ComposerPendingApprovalPanel
        approval={{
          requestId: ApprovalRequestId.make("approval-1"),
          requestKind: "command",
          createdAt: "2026-07-18T00:00:00.000Z",
          detail,
        }}
        pendingCount={1}
        comment=""
        onCommentChange={() => {}}
      />,
    );

    expect(markup).toContain('data-approval-detail="complete"');
    expect(markup).toContain('aria-label="Command"');
    expect(markup).toContain(detail);
    expect(markup).not.toContain("truncate");
    expect(markup).not.toContain("line-clamp");
    expect(markup).toContain("min-w-0");
    expect(markup).toContain("max-w-full");
    expect(markup).toContain("[overflow-wrap:anywhere]");
  });

  it("renders the amend-comment input", () => {
    const markup = renderToStaticMarkup(
      <ComposerPendingApprovalPanel
        approval={{
          requestId: ApprovalRequestId.make("approval-1"),
          requestKind: "file-change",
          createdAt: "2026-07-18T00:00:00.000Z",
          detail: "Edit: some detail",
        }}
        pendingCount={1}
        comment="please also update the callers"
        onCommentChange={() => {}}
      />,
    );

    expect(markup).toContain('aria-label="Approval comment"');
    expect(markup).toContain("please also update the callers");
  });

  it("renders a file row with line stats linking to the diff panel", () => {
    const markup = renderToStaticMarkup(
      <ComposerPendingApprovalPanel
        approval={{
          requestId: ApprovalRequestId.make("approval-1"),
          requestKind: "file-change",
          createdAt: "2026-07-18T00:00:00.000Z",
          detail: "Edit: /repo/src/logger.rs",
          fileChange: {
            filePath: "/repo/src/logger.rs",
            toolName: "Edit",
            oldString: "let a = 1;\nlet b = 2;\n",
            newString: "let a = 3;",
            startLine: 6,
          },
        }}
        pendingCount={1}
        comment=""
        onCommentChange={() => {}}
        onOpenPendingDiff={() => {}}
      />,
    );

    expect(markup).toContain("/repo/src/logger.rs");
    expect(markup).toContain("+1");
    expect(markup).toContain("-2");
    expect(markup).toContain("View diff");
    // The diff body lives in the diff panel now, not inline in the card.
    expect(markup).not.toContain("let a = 1;");
  });
});
