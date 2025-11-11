import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JobCard } from './JobCard';
import { Job } from '@/types/jobs';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface JobPipelineProps {
  jobs: Job[];
  onJobUpdate: () => void;
}

const PIPELINE_STAGES = [
  { id: 'interested', label: 'Interested', color: 'bg-blue-500' },
  { id: 'applied', label: 'Applied', color: 'bg-yellow-500' },
  { id: 'phone_screen', label: 'Phone Screen', color: 'bg-purple-500' },
  { id: 'interview', label: 'Interview', color: 'bg-orange-500' },
  { id: 'offer', label: 'Offer', color: 'bg-green-500' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

export function JobPipeline({ jobs, onJobUpdate }: JobPipelineProps) {
  const [isDragging, setIsDragging] = useState(false);

  const getJobsByStatus = (status: string) => {
    return jobs.filter(job => job.status === status && !job.isArchived);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);

    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const jobId = draggableId;

    try {
      await api.jobs.updateStatus(jobId, newStatus);
      toast.success('Job status updated');
      onJobUpdate();
    } catch (error) {
      toast.error('Failed to update job status');
      console.error('Error updating job:', error);
    }
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageJobs = getJobsByStatus(stage.id);
          
          return (
            <Card key={stage.id} className={`${isDragging ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    {stage.label}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {stageJobs.length}
                  </Badge>
                </div>
              </CardHeader>
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <CardContent
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-2 min-h-[200px] space-y-2 ${
                      snapshot.isDraggingOver ? 'bg-accent/50' : ''
                    }`}
                  >
                    {stageJobs.map((job, index) => (
                      <Draggable key={job.job_id} draggableId={job.job_id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-50' : ''}
                          >
                            <JobCard job={job} className="mb-2" />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {stageJobs.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        No jobs in this stage
                      </div>
                    )}
                  </CardContent>
                )}
              </Droppable>
            </Card>
          );
        })}
      </div>
    </DragDropContext>
  );
}
