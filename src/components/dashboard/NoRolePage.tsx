import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const NoRolePage = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Card className="max-w-md animate-fade-in">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
          <AlertCircle className="h-6 w-6 text-accent" />
        </div>
        <CardTitle>No Role Assigned</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground">
          Your account doesn't have a role yet. Please contact an administrator to get access.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default NoRolePage;
