import { Button } from "@/components/ui/button";
import { Download, Copy, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CoverLetterExportExtendedProps {
  content: string;
  companyName: string;
  jobTitle: string;
}

export const CoverLetterExportExtended = ({
  content,
  companyName,
  jobTitle,
}: CoverLetterExportExtendedProps) => {
  const { toast } = useToast();

  const handleCopyToEmail = () => {
    const emailTemplate = `Dear Hiring Manager,

${content}

Sincerely,
[Your Name]
[Your Email]
[Your Phone]`;

    navigator.clipboard.writeText(emailTemplate).then(() => {
      toast({
        title: "Copied!",
        description: "Cover letter copied to clipboard",
      });
    }).catch((error) => {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    });
  };

  const handleDownloadEML = () => {
    const safeCompany = companyName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeRole = jobTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `CoverLetter_${safeCompany}_${safeRole}.eml`;

    const emlContent = `From: 
To: 
Subject: Application for ${jobTitle} – ${companyName}
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8

Dear Hiring Manager,

${content}

Sincerely,
[Your Name]
[Your Email]
[Your Phone]
`;

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: `${filename} saved`,
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleCopyToEmail} variant="outline" size="sm">
        <Copy className="h-4 w-4 mr-2" />
        Copy to Email
      </Button>
      <Button onClick={handleDownloadEML} variant="outline" size="sm">
        <Mail className="h-4 w-4 mr-2" />
        Download .eml
      </Button>
    </div>
  );
};
