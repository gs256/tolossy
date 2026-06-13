import { PageWrapper } from "@/components/PageWrapper";
import { Spinner } from "@/components/ui/spinner";

export function LoadingScreen() {
  return (
    <PageWrapper>
      <Spinner className="size-8" />
    </PageWrapper>
  );
}
