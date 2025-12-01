import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      if (!token) throw new Error("No token provided");

      const { data, error } = await supabase
        .from("team_invitations")
        .select("*, teams(name)")
        .eq("token", token)
        .single();

      if (error) throw error;

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        throw new Error("Invitation has expired");
      }

      // Check if already accepted
      if (data.accepted) {
        throw new Error("Invitation has already been accepted");
      }

      return data;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!invitation || !token) throw new Error("Invalid invitation");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to accept invitations");

      // Check if user's email matches invitation
      if (user.email !== invitation.email) {
        throw new Error(`This invitation was sent to ${invitation.email}. Please log in with that email.`);
      }

      // Add user to team
      const { error: memberError } = await supabase
        .from("team_memberships")
        .insert([{
          team_id: invitation.team_id,
          user_id: user.id,
          role: invitation.role,
        }]);

      if (memberError) throw memberError;

      // Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from("team_invitations")
        .update({
          accepted: true,
          accepted_at: new Date().toISOString(),
          accepted_by: user.id,
        })
        .eq("token", token);

      if (inviteError) throw inviteError;
    },
    onSuccess: () => {
      toast.success("Successfully joined the team!");
      setIsAccepting(false);
      setTimeout(() => navigate("/teams"), 2000);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsAccepting(false);
    },
  });

  const handleAccept = () => {
    setIsAccepting(true);
    acceptMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-500" />
                <CardTitle>Invalid Invitation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {error?.message || "This invitation is invalid or has expired."}
              </p>
              <Button className="mt-4" onClick={() => navigate("/teams")}>
                Go to Teams
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (acceptMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <CardTitle>Success!</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You have successfully joined the team. Redirecting...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>You've been invited to join a team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Team:</span>
                <p className="font-semibold">{invitation.teams?.name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Role:</span>
                <p className="font-semibold capitalize">{invitation.role}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Invited to:</span>
                <p className="font-semibold">{invitation.email}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Expires:</span>
                <p className="font-semibold">
                  {new Date(invitation.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                By accepting, you'll be able to collaborate with your team based on your assigned role.
              </p>
            </div>

            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
