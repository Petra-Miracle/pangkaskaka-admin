import { PlaceholderPage } from "@/components/nav/placeholder-page";

export default function PaymentsPage() {
  return (
    <PlaceholderPage
      title="Payments"
      blocked
      description="Payment / webhook / Durianpay transaction monitoring. Needs GET /admin/payments?status=&page= — genuinely new backend work, not yet implemented. See AGENT_BRIEF.md section 4."
    />
  );
}
