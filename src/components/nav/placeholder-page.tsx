import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PlaceholderPage({
  title,
  description,
  blocked,
}: {
  title: string;
  description: string;
  blocked?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">{title}</h1>
        {blocked && <Badge variant="outline">Blocked on backend endpoint</Badge>}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This screen is not built yet.
        </CardContent>
      </Card>
    </div>
  );
}
