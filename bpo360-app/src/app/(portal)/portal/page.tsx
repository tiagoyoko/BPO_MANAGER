import { redirect } from "next/navigation";

/**
 * Story 3.2: Portal do cliente – redireciona para lista de solicitações.
 */
export default function PortalPage() {
  redirect("/portal/solicitacoes");
}
