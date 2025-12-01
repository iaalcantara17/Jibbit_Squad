import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ReferralTemplateGeneratorProps {
  job: any;
  contact: any;
  onClose: () => void;
}

const templates = {
  casual: {
    name: 'Casual',
    template: `Hey [CONTACT_NAME],

I hope you're doing well! I wanted to reach out because I saw an opening for [JOB_TITLE] at [COMPANY_NAME] and I'm really excited about it.

Given your experience at [COMPANY_NAME], I'd love to hear your thoughts about the role and the team. If you think I'd be a good fit, I'd really appreciate any guidance or a referral.

I've attached my resume for your reference. Let me know if you need any additional information!

Thanks so much,
[YOUR_NAME]`,
  },
  professional: {
    name: 'Professional',
    template: `Dear [CONTACT_NAME],

I hope this message finds you well. I am reaching out to express my interest in the [JOB_TITLE] position at [COMPANY_NAME].

With my background in [YOUR_FIELD/EXPERIENCE], I believe I would be a strong fit for this role. Given your experience at [COMPANY_NAME], I would greatly appreciate any insights you could share about the position and team culture.

If you feel comfortable providing a referral or introduction, I would be very grateful. I have attached my resume for your review.

Thank you for considering my request.

Best regards,
[YOUR_NAME]`,
  },
  brief: {
    name: 'Brief',
    template: `Hi [CONTACT_NAME],

Quick note - I'm applying for the [JOB_TITLE] role at [COMPANY_NAME] and thought of you!

Would you be open to providing a referral or sharing any insights about the position? I think it's a great match for my skills.

Resume attached. Thanks for considering!

[YOUR_NAME]`,
  },
};

export const ReferralTemplateGenerator = ({ job, contact, onClose }: ReferralTemplateGeneratorProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof templates>('casual');
  const [customizedMessage, setCustomizedMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const generateMessage = (templateKey: keyof typeof templates) => {
    const template = templates[templateKey].template;
    const message = template
      .replace(/\[CONTACT_NAME\]/g, contact?.name || '[Contact Name]')
      .replace(/\[JOB_TITLE\]/g, job.job_title)
      .replace(/\[COMPANY_NAME\]/g, job.company_name)
      .replace(/\[YOUR_NAME\]/g, '[Your Name]')
      .replace(/\[YOUR_FIELD\/EXPERIENCE\]/g, '[Your Field/Experience]');
    
    setCustomizedMessage(message);
    setSelectedTemplate(templateKey);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customizedMessage);
    setCopied(true);
    toast.success('Message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate initial message
  if (!customizedMessage) {
    generateMessage('casual');
  }

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Generate Referral Message</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="p-3 rounded-lg border bg-muted/50">
          <p className="text-sm font-medium mb-1">To: {contact?.name || 'Contact'}</p>
          <p className="text-sm text-muted-foreground">
            {job.job_title} at {job.company_name}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Template Style</Label>
          <div className="flex gap-2">
            {Object.entries(templates).map(([key, { name }]) => (
              <Button
                key={key}
                type="button"
                variant={selectedTemplate === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => generateMessage(key as keyof typeof templates)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Generated Message</Label>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">Editable</Badge>
            </div>
          </div>
          <Textarea
            rows={12}
            value={customizedMessage}
            onChange={(e) => setCustomizedMessage(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Tip: Replace placeholders in [brackets] with your information before sending
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Message
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
