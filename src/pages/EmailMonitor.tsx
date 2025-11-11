import { EmailStatusMonitor } from "@/components/jobs/EmailStatusMonitor";

export default function EmailMonitor() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Email Status Monitor</h1>
      <EmailStatusMonitor />
    </div>
  );
}
