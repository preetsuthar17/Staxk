"use client";

import { IconStack2 } from "@tabler/icons-react";
import { useState } from "react";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import type { IssueData } from "@/lib/issue";
import { Separator } from "../ui/separator";
import { EditIssueDialog } from "./edit-issue-dialog";
import { IssueCard } from "./issue-card";

interface IssueListProps {
  issues: IssueData[];
  onCreateIssue?: () => void;
  onIssueUpdated?: () => void;
  onIssueDeleted?: () => void;
}

export function IssueList({
  issues,
  onCreateIssue,
  onIssueUpdated,
  onIssueDeleted,
}: IssueListProps) {
  const [selectedIssue, setSelectedIssue] = useState<IssueData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleIssueClick = (issue: IssueData) => {
    setSelectedIssue(issue);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setSelectedIssue(null);
    }
  };

  if (issues.length === 0) {
    return (
      <Empty>
        <IconStack2 className="size-10 text-muted-foreground" />
        <EmptyTitle className="font-medium tracking-normal">
          No issues yet
        </EmptyTitle>
        <EmptyDescription>
          Create your first issue to start tracking work.
        </EmptyDescription>
        {onCreateIssue && (
          <button
            className="mt-2 text-primary text-sm hover:underline"
            onClick={onCreateIssue}
            type="button"
          >
            Create an issue
          </button>
        )}
      </Empty>
    );
  }

  return (
    <>
      <div className="flex flex-col rounded-lg border border-border">
        {issues.map((issue, index) => {
          const isFirst = index === 0;
          const isLast = index === issues.length - 1;

          return (
            <div
              className={[
                isFirst && "overflow-hidden rounded-t-lg",
                isLast && "overflow-hidden rounded-b-lg",
              ]
                .filter(Boolean)
                .join(" ")}
              key={issue.id}
            >
              <IssueCard
                id={issue.id}
                number={issue.number}
                onClick={() => handleIssueClick(issue)}
                projectIdentifier={issue.projectIdentifier}
                projectName={issue.projectName}
                status={issue.status}
                title={issue.title}
              />

              {!isLast && <Separator />}
            </div>
          );
        })}
      </div>

      {selectedIssue && (
        <EditIssueDialog
          issue={selectedIssue}
          onDelete={onIssueDeleted}
          onOpenChange={handleDialogClose}
          onSuccess={onIssueUpdated}
          open={isEditDialogOpen}
        />
      )}
    </>
  );
}
