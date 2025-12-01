import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building2, Mail, MoreVertical, Phone, Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContactCardProps {
  contact: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
    relationship_type?: string;
    tags?: string[];
    relationship_strength?: number;
    last_contacted_at?: string;
  };
  onEdit: (contact: any) => void;
  onDelete: (contactId: string) => void;
  onView: (contactId: string) => void;
}

export const ContactCard = ({ contact, onEdit, onDelete, onView }: ContactCardProps) => {
  const renderStars = () => {
    const strength = contact.relationship_strength || 3;
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < strength ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onView(contact.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{contact.name}</h3>
              {contact.relationship_type && (
                <p className="text-xs text-muted-foreground capitalize">{contact.relationship_type}</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(contact.id); }}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(contact); }}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this contact?')) {
                    onDelete(contact.id);
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
        {contact.company && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{contact.company}</span>
            {contact.role && <span className="text-muted-foreground">• {contact.role}</span>}
          </div>
        )}
        
        <div className="space-y-1">
          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Strength:</span>
            {renderStars()}
          </div>
          {contact.last_contacted_at && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(contact.last_contacted_at), { addSuffix: true })}
            </span>
          )}
        </div>

        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {contact.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {contact.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{contact.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
