// UC-087: Referral timing suggestions UI component

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { calculateOptimalReferralTiming, shouldFollowUp } from '@/lib/referralTiming';
import { format } from 'date-fns';

interface ReferralTimingWidgetProps {
  relationshipStrength: number;
  lastContactedAt: Date | null;
  jobDeadline: Date | null;
  jobCreatedAt: Date;
  status: string;
  sentAt: Date | null;
  followUpAt: Date | null;
}

export function ReferralTimingWidget({
  relationshipStrength,
  lastContactedAt,
  jobDeadline,
  jobCreatedAt,
  status,
  sentAt,
  followUpAt,
}: ReferralTimingWidgetProps) {
  const timing = calculateOptimalReferralTiming(
    relationshipStrength,
    lastContactedAt,
    jobDeadline,
    jobCreatedAt
  );

  const followUpCheck = shouldFollowUp(status, sentAt, followUpAt);

  const confidenceColor = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500',
  }[timing.confidence];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Optimal Timing Recommendation
        </CardTitle>
        <CardDescription>
          AI-powered timing based on relationship strength and context
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Confidence:</span>
          <Badge className={confidenceColor}>
            {timing.confidence.toUpperCase()}
          </Badge>
        </div>

        {/* Send Timing */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Best Time to Send Request
          </div>
          <div className="pl-6 text-lg font-bold text-primary">
            {format(timing.optimalSendTime, 'EEEE, MMM d, yyyy')}
          </div>
        </div>

        {/* Follow-up Timing */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Suggested Follow-up Date
          </div>
          <div className="pl-6 text-lg font-bold text-primary">
            {format(timing.followUpTime, 'EEEE, MMM d, yyyy')}
          </div>
        </div>

        {/* Reasoning */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Why this timing?</div>
          <ul className="space-y-1 pl-6">
            {timing.reasoning.map((reason, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Follow-up Alert */}
        {status === 'sent' && followUpCheck.shouldFollowUp && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-yellow-500">Follow-up Recommended</div>
              <div className="text-muted-foreground">{followUpCheck.reason}</div>
            </div>
          </div>
        )}

        {status === 'responded' && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-green-500">Contact Responded</div>
              <div className="text-muted-foreground">Great! Now follow their lead on next steps.</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
