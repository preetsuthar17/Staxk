import { Spinner } from "@/components/ui/spinner";

export default function WorkspaceLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}
