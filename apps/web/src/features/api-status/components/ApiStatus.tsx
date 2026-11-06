import { LabProvider } from "@csst106/api-client";
import { StatusBadge } from "@csst106/ui";
import { useHealth } from "../hooks/useHealth";

function Status() {
  const { isPending, isError } = useHealth();
  if (isPending) return <StatusBadge>Checking API</StatusBadge>;
  if (isError)
    return <StatusBadge tone="danger">API offline: start it with pnpm dev:api</StatusBadge>;
  return <StatusBadge tone="success">API online</StatusBadge>;
}

export function ApiStatus() {
  return (
    <LabProvider>
      <Status />
    </LabProvider>
  );
}
