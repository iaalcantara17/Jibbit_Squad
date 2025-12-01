import { Navigation } from '@/components/Navigation';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

const Documents = () => {
  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ['my-resumes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: coverLetters, isLoading: clLoading } = useQuery({
    queryKey: ['my-cover-letters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cover_letters')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: sharedWithMe } = useQuery({
    queryKey: ['shared-documents'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('document_shares_internal')
        .select('*')
        .eq('shared_with_user_id', user.id);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold">Documents</h1>
                <p className="text-muted-foreground mt-1">
                  Collaborate on resumes and cover letters
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/resumes">
                  <Plus className="h-4 w-4 mr-2" />
                  New Resume
                </Link>
              </Button>
              <Button asChild>
                <Link to="/cover-letters">
                  <Plus className="h-4 w-4 mr-2" />
                  New Cover Letter
                </Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="resumes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resumes">
                My Resumes ({resumes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="cover-letters">
                My Cover Letters ({coverLetters?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="shared">
                Shared with Me ({sharedWithMe?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumes" className="space-y-4 mt-6">
              {resumesLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : resumes?.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No resumes yet</p>
                  <Button asChild className="mt-4">
                    <Link to="/resumes">Create your first resume</Link>
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {resumes?.map((resume) => (
                    <Card key={resume.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <Link to={`/documents/resume/${resume.id}`} className="block">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{resume.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Last updated {format(new Date(resume.updated_at || resume.created_at || ''), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {resume.is_default && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                            <Badge variant="outline">{resume.template}</Badge>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cover-letters" className="space-y-4 mt-6">
              {clLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : coverLetters?.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No cover letters yet</p>
                  <Button asChild className="mt-4">
                    <Link to="/cover-letters">Create your first cover letter</Link>
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {coverLetters?.map((cl) => (
                    <Card key={cl.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <Link to={`/documents/cover-letter/${cl.id}`} className="block">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{cl.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Last updated {format(new Date(cl.updated_at || cl.created_at || ''), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared" className="space-y-4 mt-6">
              {!sharedWithMe?.length ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No documents shared with you yet
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {sharedWithMe?.map((share) => (
                    <Card key={share.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <Link
                        to={`/documents/${share.document_type}/${share.document_id}`}
                        className="block"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold capitalize">
                              {share.document_type.replace('_', ' ')}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Shared {format(new Date(share.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge variant={share.permission === 'comment' ? 'default' : 'secondary'}>
                            {share.permission}
                          </Badge>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Documents;
