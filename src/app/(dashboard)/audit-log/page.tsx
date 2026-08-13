import { PlaceholderPage } from "@/components/nav/placeholder-page";

export default function AuditLogPage() {
  return (
    <PlaceholderPage
      title="Audit Log"
      blocked
      description="Trail of which admin approved/rejected/suspended what, when. Needs a new admin_audit_log collection plus GET /admin/audit-log and writes on every admin mutation — doesn't exist in any form yet. See AGENT_BRIEF.md section 4."
    />
  );
}
