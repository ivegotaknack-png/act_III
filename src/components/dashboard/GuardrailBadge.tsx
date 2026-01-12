import { Badge } from "@/components/ui/badge";

interface GuardrailBadgeProps {
  withdrawalRate: number; // e.g. 0.045
  isSolvent: boolean;
}

export default function GuardrailBadge({ withdrawalRate, isSolvent }: GuardrailBadgeProps) {
  if (!isSolvent) {
    return <Badge variant="destructive">Critical Failure</Badge>;
  }

  if (withdrawalRate > 0.055) {
    return <Badge variant="destructive">Danger Zone</Badge>;
  }

  if (withdrawalRate > 0.04) {
    return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Caution</Badge>;
  }

  return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Safe</Badge>;
}
