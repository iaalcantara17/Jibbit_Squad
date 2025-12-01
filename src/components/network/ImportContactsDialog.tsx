import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Link as LinkIcon, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const ImportContactsDialog = ({ open, onOpenChange, onImportComplete }: ImportContactsDialogProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const handleGoogleContactsImport = async () => {
    setIsImporting(true);
    try {
      // Call edge function to initiate Google OAuth for contacts
      const { data, error } = await supabase.functions.invoke('google-contacts-import', {
        body: { action: 'start_oauth' }
      });

      if (error) throw error;

      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast.error('Failed to start Google import', { description: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const text = await csvFile.text();
      const rows = text.split('\n');
      const headers = rows[0].toLowerCase().split(',').map(h => h.trim());
      
      const contacts = [];
      const duplicates = [];
      
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => v.trim());
        if (values.length < 2) continue;

        const contact: any = { user_id: user.id };
        headers.forEach((header, index) => {
          const value = values[index] || '';
          if (header === 'name' || header === 'full name') contact.name = value;
          else if (header === 'email') contact.email = value || null;
          else if (header === 'phone') contact.phone = value || null;
          else if (header === 'company') contact.company = value || null;
          else if (header === 'role' || header === 'title') contact.role = value || null;
        });

        if (!contact.name) continue;

        // Check for duplicate
        if (contact.email) {
          const { data: existing } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('user_id', user.id)
            .eq('email', contact.email)
            .single();

          if (existing) {
            duplicates.push({ ...contact, existingName: existing.name });
            continue;
          }
        }

        contacts.push(contact);
      }

      if (contacts.length > 0) {
        const { error } = await supabase.from('contacts').insert(contacts);
        if (error) throw error;
      }

      toast.success(`Imported ${contacts.length} contacts${duplicates.length > 0 ? `, skipped ${duplicates.length} duplicates` : ''}`);
      onImportComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to import CSV', { description: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="google" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google">
              <LinkIcon className="h-4 w-4 mr-2" />
              Google Contacts
            </TabsTrigger>
            <TabsTrigger value="csv">
              <FileText className="h-4 w-4 mr-2" />
              CSV File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="space-y-4">
            <Alert>
              <AlertDescription>
                Connect your Google account to import contacts. Duplicates will be automatically detected by email.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleGoogleContactsImport} 
              disabled={isImporting}
              className="w-full"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isImporting ? 'Connecting...' : 'Import from Google Contacts'}
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <Alert>
              <AlertDescription>
                Upload a CSV file with headers: name, email, phone, company, role. Duplicates by email will be skipped.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Select CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                disabled={isImporting}
              />
            </div>
            <Button 
              onClick={handleCsvImport} 
              disabled={isImporting || !csvFile}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import CSV'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
