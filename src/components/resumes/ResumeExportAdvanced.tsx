import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface Props {
  resumeData: any;
  fileName?: string;
}

export const ResumeExportAdvanced = ({ resumeData, fileName = 'resume' }: Props) => {
  const [format, setFormat] = useState<'pdf' | 'txt' | 'html'>('pdf');
  const [theme, setTheme] = useState('modern');
  const [watermark, setWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('DRAFT');

  const exportTXT = () => {
    const sections = resumeData.sections || [];
    let content = '';

    sections.forEach((section: any) => {
      if (!section.isVisible) return;
      content += `\n${section.title.toUpperCase()}\n${'='.repeat(section.title.length)}\n${section.content}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as TXT');
  };

  const exportHTML = () => {
    const sections = resumeData.sections || [];
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${resumeData.title}</title>
  <style>
    @media print {
      body { margin: 0.5in; font-family: Arial, sans-serif; }
      h1 { font-size: 24pt; margin-bottom: 10pt; }
      h2 { font-size: 14pt; margin-top: 15pt; color: #333; border-bottom: 1px solid #ccc; }
      p { font-size: 11pt; line-height: 1.4; }
    }
    body { max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
    h1 { font-size: 28px; margin-bottom: 10px; }
    h2 { font-size: 18px; margin-top: 20px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    p { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
    ${watermark ? `.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.05); z-index: -1; }` : ''}
  </style>
</head>
<body>
  ${watermark ? `<div class="watermark">${watermarkText}</div>` : ''}
  <h1>${resumeData.title}</h1>
  ${sections.filter((s: any) => s.isVisible).map((section: any) => `
    <section>
      <h2>${section.title}</h2>
      <p>${section.content}</p>
    </section>
  `).join('')}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as HTML');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const sections = resumeData.sections || [];
    let y = 20;

    // Title
    doc.setFontSize(20);
    doc.text(resumeData.title, 20, y);
    y += 15;

    // Watermark
    if (watermark) {
      doc.setFontSize(80);
      doc.setTextColor(200, 200, 200);
      doc.text(watermarkText, 105, 150, { align: 'center', angle: 45 });
      doc.setTextColor(0, 0, 0);
    }

    // Sections
    sections.filter((s: any) => s.isVisible).forEach((section: any) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text(section.title, 20, y);
      y += 8;

      doc.setFontSize(10);
      const lines = doc.splitTextToSize(section.content, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 10;
    });

    doc.save(`${fileName}.pdf`);
    toast.success('Exported as PDF');
  };

  const handleExport = () => {
    switch (format) {
      case 'txt':
        exportTXT();
        break;
      case 'html':
        exportHTML();
        break;
      case 'pdf':
        exportPDF();
        break;
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Advanced Export
      </h3>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Format</Label>
          <Select value={format} onValueChange={(v: any) => setFormat(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="txt">Plain Text</SelectItem>
              <SelectItem value="html">HTML (with print CSS)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>File Name</Label>
          <Input value={fileName} onChange={(e) => {}} placeholder="resume" />
        </div>

        <div className="flex items-center justify-between">
          <Label>Watermark</Label>
          <Switch checked={watermark} onCheckedChange={setWatermark} />
        </div>

        {watermark && (
          <Input
            placeholder="Watermark text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
          />
        )}

        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export {format.toUpperCase()}
        </Button>
      </div>
    </div>
  );
};
