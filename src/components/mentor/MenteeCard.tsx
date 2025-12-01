import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Briefcase, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface MenteeCardProps {
  mentee: {
    user_id: string;
    profile?: {
      name?: string;
      email?: string;
    };
    stats: {
      applications: number;
      interviews: number;
      offers: number;
      activeGoals: number;
    };
  };
}

export const MenteeCard = ({ mentee }: MenteeCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {mentee.profile?.name || mentee.profile?.email || "Unknown"}
        </CardTitle>
        {mentee.profile?.email && (
          <p className="text-sm text-muted-foreground">{mentee.profile.email}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{mentee.stats.applications}</div>
              <div className="text-xs text-muted-foreground">Applications</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{mentee.stats.interviews}</div>
              <div className="text-xs text-muted-foreground">Interviews</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{mentee.stats.offers}</div>
              <div className="text-xs text-muted-foreground">Offers</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{mentee.stats.activeGoals}</div>
              <div className="text-xs text-muted-foreground">Active Goals</div>
            </div>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link to={`/mentor/mentee/${mentee.user_id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
