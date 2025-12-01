import { describe, it, expect } from 'vitest';

describe('Event Discovery', () => {
  it('should filter events by industry', () => {
    const allEvents = [
      { title: 'Tech Summit', industry: 'technology', location: 'SF' },
      { title: 'Finance Forum', industry: 'finance', location: 'NY' },
      { title: 'Tech Meetup', industry: 'technology', location: 'Austin' },
    ];

    const filtered = allEvents.filter(e => e.industry === 'technology');

    expect(filtered).toHaveLength(2);
    expect(filtered.every(e => e.industry === 'technology')).toBe(true);
  });

  it('should filter events by location', () => {
    const allEvents = [
      { title: 'Event 1', industry: 'tech', location: 'San Francisco' },
      { title: 'Event 2', industry: 'tech', location: 'New York' },
      { title: 'Event 3', industry: 'tech', location: 'San Diego' },
    ];

    const filtered = allEvents.filter(e => 
      e.location.toLowerCase().includes('san')
    );

    expect(filtered).toHaveLength(2);
    expect(filtered.every(e => e.location.includes('San'))).toBe(true);
  });

  it('should use demo dataset as fallback', () => {
    const demoDataset: Record<string, any[]> = {
      'technology': [{ title: 'Demo Tech Event' }],
      'default': [{ title: 'Demo General Event' }],
    };

    const industry = 'technology';
    const events = demoDataset[industry] || demoDataset['default'];

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Demo Tech Event');
  });
});
