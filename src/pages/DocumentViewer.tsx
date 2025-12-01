import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Share2, FileText } from 'lucide-react';
import { DocumentComments } from '@/components/documents/DocumentComments';
import { DocumentShareDialog } from '@/components/documents/DocumentShareDialog';
import { VersionHistory } from '@/components/documents/VersionHistory';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DOMPurify from 'dompurify';

const DocumentViewer = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const documentType = type as 'resume' | 'cover_letter';

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', documentType, id],
    queryFn: async () => {
      if (documentType === 'resume') {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('cover_letters')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      }
    },
  });

  const { data: permission } = useQuery({
    queryKey: ['document-permission', documentType, id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if user is owner
      if (document?.user_id === user.id) {
        return { isOwner: true, canComment: true };
      }

      // Check shared permissions
      const { data, error } = await supabase
        .from('document_shares_internal')
        .select('permission')
        .eq('document_type', documentType)
        .eq('document_id', id)
        .eq('shared_with_user_id', user.id)
        .single();

      if (error) return { isOwner: false, canComment: false };
      return {
        isOwner: false,
        canComment: data.permission === 'comment',
      };
    },
    enabled: !!document,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8">
          <p className="text-muted-foreground">Document not found</p>
        </div>
      </div>
    );
  }

  const versions = (document.versions as any[]) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6" />
                <div>
                  <h1 className="text-3xl font-display font-bold">
                    {document.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="capitalize">
                      {documentType.replace('_', ' ')}
                    </Badge>
                    {permission?.isOwner && (
                      <Badge variant="secondary">Owner</Badge>
                    )}
                    {!permission?.isOwner && permission?.canComment && (
                      <Badge variant="default">Can Comment</Badge>
                    )}
                    {!permission?.isOwner && !permission?.canComment && (
                      <Badge variant="secondary">View Only</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {permission?.isOwner && (
              <Button onClick={() => setShareDialogOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <Tabs defaultValue="content">
                  <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="versions">Versions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="mt-6">
                    {documentType === 'resume' ? (
                      <div className="space-y-4">
                        <div className="prose max-w-none">
                          <p className="text-sm text-muted-foreground">
                            Resume sections are displayed in the Resume Builder.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => navigate('/resumes')}
                            className="mt-4"
                          >
                            Open in Resume Builder
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="prose max-w-none">
                          <div
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(
                                ('content' in document ? document.content : null) || 'No content',
                                {
                                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'a'],
                                  ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
                                }
                              ),
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="versions" className="mt-6">
                    <VersionHistory versions={versions} />
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <DocumentComments
                documentType={documentType}
                documentId={id!}
                canComment={permission?.canComment || false}
              />
            </div>
          </div>
        </div>
      </div>

      <DocumentShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        documentType={documentType}
        documentId={id!}
      />
    </div>
  );
};

export default DocumentViewer;
