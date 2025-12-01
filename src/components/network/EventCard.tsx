import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, MapPin, MoreVertical, Users, Video, CheckCircle } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';

interface EventCardProps {
  event: any;
  onEdit: (event: any) => void;
  onDelete: (eventId: string) => void;
  onView: (eventId: string) => void;
}

export const EventCard = ({ event, onEdit, onDelete, onView }: EventCardProps) => {
  const isUpcoming = isFuture(new Date(event.event_date));
  const hasPassed = isPast(new Date(event.event_date));

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onView(event.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{event.title}</h3>
              {event.attended && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(event.event_date), 'PPP')}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(event.id); }}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(event); }}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this event?')) {
                    onDelete(event.id);
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <Badge variant={isUpcoming ? 'default' : 'secondary'}>
            {isUpcoming ? 'Upcoming' : 'Past'}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {event.event_type === 'virtual' ? (
              <><Video className="h-3 w-3 mr-1" /> Virtual</>
            ) : (
              <><MapPin className="h-3 w-3 mr-1" /> In-person</>
            )}
          </Badge>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {event.goals && (
          <p className="text-sm text-muted-foreground line-clamp-2">{event.goals}</p>
        )}

        {event.prep_checklist && event.prep_checklist.length > 0 && !hasPassed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Users className="h-3 w-3" />
            <span>
              {event.prep_checklist.filter((item: any) => item.completed).length}/{event.prep_checklist.length} checklist items
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
