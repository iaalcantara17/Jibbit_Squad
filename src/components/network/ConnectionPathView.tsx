// UC-092: Connection path visualization component

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight, Building, Briefcase } from 'lucide-react';
import type { ConnectionPath } from '@/lib/connectionPathFinder';

interface ConnectionPathViewProps {
  path: ConnectionPath | null;
  loading?: boolean;
}

export function ConnectionPathView({ path, loading }: ConnectionPathViewProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!path) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No connection path found within 3 degrees</p>
          <p className="text-sm mt-1">Consider expanding your network or using other channels</p>
        </CardContent>
      </Card>
    );
  }

  const getDegreeColor = (degree: 1 | 2 | 3) => {
    switch (degree) {
      case 1:
        return 'bg-green-500';
      case 2:
        return 'bg-blue-500';
      case 3:
        return 'bg-purple-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Connection Path to {path.target.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Degree Badge */}
        <div className="flex items-center gap-2">
          <Badge className={getDegreeColor(path.degree)}>
            {path.degree === 1 ? '1st Degree' : path.degree === 2 ? '2nd Degree' : '3rd Degree'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {path.pathDescription}
          </span>
        </div>

        {/* Path Visualization */}
        <div className="space-y-3">
          {path.path.map((contact, idx) => (
            <div key={contact.id}>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {contact.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{contact.name}</div>
                  {(contact.role || contact.company) && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {contact.role && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {contact.role}
                        </span>
                      )}
                      {contact.company && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {contact.company}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {idx < path.path.length - 1 && (
                <div className="flex justify-center my-1">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Target Contact (if different from last in path) */}
          {path.target.id !== path.path[path.path.length - 1]?.id && (
            <>
              <div className="flex justify-center my-1">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border-2 border-primary">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {path.target.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{path.target.name}</div>
                  <div className="text-xs text-muted-foreground">Target Contact</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Suggestions */}
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="text-sm font-medium text-blue-500 mb-1">Suggested Action</div>
          <div className="text-sm text-muted-foreground">
            {path.degree === 1 && 'Reach out directly - you have a direct connection!'}
            {path.degree === 2 && `Ask ${path.path[0].name} for an introduction`}
            {path.degree === 3 && `Ask ${path.path[0].name} to connect you with ${path.path[1].name}, who can introduce you`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
