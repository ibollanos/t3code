import { memo } from "react";
import { type PendingApproval } from "../../session-logic";
import { DiffStatLabel } from "./DiffStatLabel";
import { Textarea } from "../ui/textarea";

interface ComposerPendingApprovalPanelProps {
  approval: PendingApproval;
  pendingCount: number;
  comment: string;
  onCommentChange: (comment: string) => void;
  /** Opens the diff panel's pending-approval view, when the host provides one. */
  onOpenPendingDiff?: (() => void) | undefined;
}

function countContentLines(text: string): number {
  if (text.length === 0) return 0;
  const lines = text.split("\n").length;
  return text.endsWith("\n") ? lines - 1 : lines;
}

export const ComposerPendingApprovalPanel = memo(function ComposerPendingApprovalPanel({
  approval,
  pendingCount,
  comment,
  onCommentChange,
  onOpenPendingDiff,
}: ComposerPendingApprovalPanelProps) {
  const approvalSummary =
    approval.requestKind === "command"
      ? "Command approval requested"
      : approval.requestKind === "file-read"
        ? "File-read approval requested"
        : "File-change approval requested";
  const detailLabel =
    approval.requestKind === "command"
      ? "Command"
      : approval.requestKind === "file-read"
        ? "File to read"
        : "File change";
  const fileChange = approval.fileChange;

  return (
    <div className="min-w-0 px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="uppercase text-sm tracking-[0.2em]">PENDING APPROVAL</span>
        <span className="text-sm font-medium">{approvalSummary}</span>
        {pendingCount > 1 ? (
          <span className="text-xs text-muted-foreground">1/{pendingCount}</span>
        ) : null}
      </div>
      {fileChange ? (
        <button
          type="button"
          onClick={onOpenPendingDiff}
          disabled={!onOpenPendingDiff}
          className="mt-3 flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-border/65 bg-background/70 px-3 py-2 text-left transition-colors enabled:hover:bg-accent/50"
        >
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
            {fileChange.filePath}
          </span>
          <DiffStatLabel
            additions={countContentLines(fileChange.newString)}
            deletions={countContentLines(fileChange.oldString)}
            className="shrink-0 text-[11px]"
            layout="inline"
          />
          {onOpenPendingDiff ? (
            <span className="shrink-0 text-[11px] text-muted-foreground">View diff</span>
          ) : null}
        </button>
      ) : approval.detail ? (
        <div className="mt-3 min-w-0 max-w-full rounded-lg border border-border/65 bg-background/70 p-3">
          <p className="text-xs font-medium text-muted-foreground">{detailLabel}</p>
          <pre
            aria-label={detailLabel}
            className="mt-2 min-w-0 max-w-full max-h-40 overflow-auto whitespace-pre-wrap [overflow-wrap:anywhere] font-mono text-xs leading-relaxed text-foreground"
            data-approval-detail="complete"
          >
            {approval.detail}
          </pre>
        </div>
      ) : null}
      <Textarea
        size="sm"
        rows={1}
        value={comment}
        onChange={(event) => onCommentChange(event.target.value)}
        onKeyDown={(event) => {
          // Keep composer-level keybindings (send, interrupt, palette) from
          // seeing keystrokes meant for the note.
          event.stopPropagation();
        }}
        placeholder="Add a note for the agent… (optional, sent with your decision)"
        aria-label="Approval comment"
        className="mt-3"
      />
    </div>
  );
});
