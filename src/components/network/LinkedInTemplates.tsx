import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const connectionRequestTemplates = [
  {
    title: "Job Application Follow-up",
    content: "Hi [Name],\n\nI recently applied for the [Position] role at [Company] and noticed we share mutual interests in [Interest/Industry]. I'd love to connect and learn more about [Company]'s culture and the work your team is doing.\n\nLooking forward to connecting!\n\nBest,\n[Your Name]"
  },
  {
    title: "Informational Interview Request",
    content: "Hi [Name],\n\nI'm currently exploring opportunities in [Industry/Field] and came across your profile. Your experience at [Company] is impressive, particularly [specific achievement].\n\nI'd appreciate the chance to connect and learn from your insights when your schedule permits.\n\nThank you for considering!\n\nBest,\n[Your Name]"
  },
  {
    title: "Referral Request",
    content: "Hi [Name],\n\nI hope this message finds you well. I'm reaching out because I noticed you work at [Company], where I've applied for the [Position] role.\n\nGiven your experience in [Relevant Area], I thought you might be able to provide insights or potentially connect me with the hiring team.\n\nThank you for any guidance you can offer!\n\nBest,\n[Your Name]"
  }
];

const outreachTemplates = [
  {
    title: "Post-Event Follow-up",
    content: "Hi [Name],\n\nIt was great meeting you at [Event Name] yesterday! I really enjoyed our conversation about [Topic].\n\nI'd love to stay connected and continue the discussion. Would you be open to a brief coffee chat in the coming weeks?\n\nBest,\n[Your Name]"
  },
  {
    title: "Mutual Connection Introduction",
    content: "Hi [Name],\n\n[Mutual Connection] suggested I reach out to you. I'm currently [Your Situation] and [Mutual Connection] thought you might have valuable insights given your experience at [Company].\n\nWould you be open to a brief conversation?\n\nThank you,\n[Your Name]"
  },
  {
    title: "Industry Expert Outreach",
    content: "Hi [Name],\n\nI've been following your content on [Topic/Platform] and find your perspective on [Specific Topic] incredibly valuable.\n\nI'm currently [Your Situation] and would appreciate any advice you might have. Would you be open to connecting?\n\nThank you for considering,\n[Your Name]"
  }
];

export const LinkedInTemplates = () => {
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Your Name');

  useEffect(() => {
    const loadUserName = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();
      if (data?.name) {
        setUserName(data.name);
      }
    };
    loadUserName();
  }, [user]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      // Replace [Your Name] placeholder with actual user name
      const personalizedText = text.replace(/\[Your Name\]/g, userName);
      await navigator.clipboard.writeText(personalizedText);
      setCopiedId(id);
      toast.success('Template copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy template');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connection Request Templates</CardTitle>
          <CardDescription>
            Professional templates for LinkedIn connection requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionRequestTemplates.map((template, index) => {
            const id = `connection-${index}`;
            return (
              <div key={id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{template.title}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(template.content, id)}
                  >
                    {copiedId === id ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={template.content}
                  readOnly
                  rows={6}
                  className="text-sm font-mono"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outreach Templates</CardTitle>
          <CardDescription>
            Templates for following up and building relationships
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {outreachTemplates.map((template, index) => {
            const id = `outreach-${index}`;
            return (
              <div key={id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{template.title}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(template.content, id)}
                  >
                    {copiedId === id ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={template.content}
                  readOnly
                  rows={6}
                  className="text-sm font-mono"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};