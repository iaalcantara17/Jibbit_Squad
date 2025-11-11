import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GripVertical, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ResumeSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
  isVisible: boolean;
}

interface ResumeSectionEditorProps {
  sections: ResumeSection[];
  onUpdate: (sections: ResumeSection[]) => void;
}

export const ResumeSectionEditor = ({ sections, onUpdate }: ResumeSectionEditorProps) => {
  const [localSections, setLocalSections] = useState(sections);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedSections = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setLocalSections(updatedSections);
    onUpdate(updatedSections);
    toast.success("Sections reordered");
  };

  const toggleVisibility = (sectionId: string) => {
    const updated = localSections.map(s =>
      s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
    );
    setLocalSections(updated);
    onUpdate(updated);
  };

  const updateSection = (sectionId: string, field: string, value: string) => {
    const updated = localSections.map(s =>
      s.id === sectionId ? { ...s, [field]: value } : s
    );
    setLocalSections(updated);
  };

  const saveSection = (sectionId: string) => {
    onUpdate(localSections);
    toast.success("Section updated");
  };

  const addSection = () => {
    const newSection: ResumeSection = {
      id: `section-${Date.now()}`,
      type: "custom",
      title: "New Section",
      content: "",
      order: localSections.length,
      isVisible: true,
    };
    const updated = [...localSections, newSection];
    setLocalSections(updated);
    onUpdate(updated);
  };

  const deleteSection = (sectionId: string) => {
    const updated = localSections.filter(s => s.id !== sectionId);
    setLocalSections(updated);
    onUpdate(updated);
    toast.success("Section deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Resume Sections</h3>
        <Button onClick={addSection} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {localSections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={snapshot.isDragging ? "shadow-lg" : ""}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                          </div>
                          <Input
                            value={section.title}
                            onChange={(e) => updateSection(section.id, "title", e.target.value)}
                            onBlur={() => saveSection(section.id)}
                            className="font-semibold"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleVisibility(section.id)}
                            >
                              {section.isVisible ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                            {section.type === "custom" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSection(section.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(section.id, "content", e.target.value)}
                          onBlur={() => saveSection(section.id)}
                          placeholder="Section content..."
                          className="min-h-[200px]"
                          rows={10}
                        />
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
