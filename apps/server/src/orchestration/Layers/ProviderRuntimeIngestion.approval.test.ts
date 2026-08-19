import {
  EventId,
  ProviderDriverKind,
  RuntimeRequestId,
  ThreadId,
  type ProviderRuntimeEvent,
} from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { runtimeEventToActivities } from "./ProviderRuntimeIngestion.ts";

describe("runtimeEventToActivities approval details", () => {
  it("preserves complete multiline command details", () => {
    const detail = `bun run release -- ${"long-argument ".repeat(20)}\nsecond line`;
    const event = {
      type: "request.opened",
      eventId: EventId.make("evt-request-opened"),
      provider: ProviderDriverKind.make("codex"),
      createdAt: "2026-07-18T00:00:00.000Z",
      threadId: ThreadId.make("thread-1"),
      requestId: RuntimeRequestId.make("approval-1"),
      payload: {
        requestType: "command_execution_approval",
        detail,
      },
    } satisfies ProviderRuntimeEvent;

    const [activity] = runtimeEventToActivities(event);

    expect(activity?.kind).toBe("approval.requested");
    expect((activity?.payload as Record<string, unknown> | undefined)?.detail).toBe(detail);
  });

  it("forwards the structured fileChange for file-change approvals", () => {
    const fileChange = {
      filePath: "/repo/src/logger.rs",
      toolName: "Edit",
      oldString: "let level = Level::INFO;",
      newString: "let level = Level::DEBUG;",
      startLine: 6,
    };
    const event = {
      type: "request.opened",
      eventId: EventId.make("evt-request-opened-file-change"),
      provider: ProviderDriverKind.make("claudeAgent"),
      createdAt: "2026-07-18T00:00:00.000Z",
      threadId: ThreadId.make("thread-1"),
      requestId: RuntimeRequestId.make("approval-2"),
      payload: {
        requestType: "file_change_approval",
        detail: "Edit: /repo/src/logger.rs",
        fileChange,
      },
    } satisfies ProviderRuntimeEvent;

    const [activity] = runtimeEventToActivities(event);

    expect(activity?.kind).toBe("approval.requested");
    const payload = activity?.payload as Record<string, unknown> | undefined;
    expect(payload?.requestKind).toBe("file-change");
    expect(payload?.fileChange).toEqual(fileChange);
  });
});
