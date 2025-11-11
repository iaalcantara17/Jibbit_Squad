import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface TonePreset {
  id: string;
  name: string;
  description: string;
  example: string;
  tags: string[];
}

const tonePresets: TonePreset[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Formal, polished, traditional',
    example: 'I am writing to express my strong interest in...',
    tags: ['corporate', 'formal', 'conservative'],
  },
  {
    id: 'enthusiastic',
    name: 'Enthusiastic',
    description: 'Energetic, passionate, motivated',
    example: "I'm thrilled to apply for this exciting opportunity...",
    tags: ['startup', 'energetic', 'passionate'],
  },
  {
    id: 'analytical',
    name: 'Analytical',
    description: 'Data-driven, logical, precise',
    example: 'With 5+ years of experience delivering measurable results...',
    tags: ['technical', 'data-driven', 'precise'],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Innovative, unique, storytelling',
    example: 'My journey in design began when I realized...',
    tags: ['design', 'marketing', 'innovative'],
  },
  {
    id: 'confident',
    name: 'Confident',
    description: 'Assertive, direct, accomplished',
    example: 'I bring a proven track record of driving growth...',
    tags: ['leadership', 'senior', 'assertive'],
  },
  {
    id: 'humble',
    name: 'Humble',
    description: 'Collaborative, team-oriented, learning-focused',
    example: 'I would welcome the opportunity to contribute to your team...',
    tags: ['entry-level', 'collaborative', 'learning'],
  },
];

interface Props {
  onSelect: (preset: TonePreset) => void;
  currentTone?: string;
}

export const CoverLetterToneStylePresets = ({ onSelect, currentTone }: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5" />
        <h3 className="font-semibold">Tone & Style Presets</h3>
      </div>

      <div className="grid gap-3">
        {tonePresets.map((preset) => (
          <Card
            key={preset.id}
            className={`cursor-pointer transition-all hover:border-primary ${
              currentTone === preset.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => onSelect(preset)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{preset.name}</h4>
                    <p className="text-sm text-muted-foreground">{preset.description}</p>
                  </div>
                  {currentTone === preset.id && (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
                <p className="text-sm italic text-muted-foreground border-l-2 pl-2">
                  "{preset.example}"
                </p>
                <div className="flex gap-1 flex-wrap">
                  {preset.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
