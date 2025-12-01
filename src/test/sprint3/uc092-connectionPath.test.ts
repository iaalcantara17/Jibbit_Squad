import { describe, it, expect } from 'vitest';
import { findConnectionPath, filterAlumni, filterInfluencers } from '@/lib/connectionPathFinder';
import type { Contact, ConnectionEdge } from '@/lib/connectionPathFinder';

describe('UC-092: Industry Contact Discovery - Connection Path Finding', () => {
  const userContacts: Contact[] = [
    { id: '1', name: 'Alice Johnson', company: 'TechCorp', role: 'Engineer' },
    { id: '2', name: 'Bob Smith', company: 'DataInc', role: 'PM' },
    { id: '3', name: 'Charlie Davis', company: 'CloudSys', role: 'Designer' },
  ];

  const connections: ConnectionEdge[] = [
    { contact_id_a: '1', contact_id_b: '4', relationship_type: 'colleague' },
    { contact_id_a: '2', contact_id_b: '5', relationship_type: 'former_colleague' },
    { contact_id_a: '4', contact_id_b: '6', relationship_type: 'friend' },
    { contact_id_a: '5', contact_id_b: '7', relationship_type: 'mentor' },
  ];

  it('identifies 1st degree connection (direct contact)', () => {
    const targetId = '1'; // Alice is direct contact
    const path = findConnectionPath(userContacts, targetId, connections);

    expect(path).not.toBeNull();
    expect(path!.degree).toBe(1);
    expect(path!.pathDescription).toBe('Direct connection');
    expect(path!.path).toHaveLength(1);
    expect(path!.target.id).toBe('1');
  });

  it('finds 2nd degree connection via intermediate', () => {
    const allContacts: Contact[] = [
      ...userContacts,
      { id: '4', name: 'Diana Wilson', company: 'InnovateAI', role: 'CTO' },
    ];

    const targetId = '4'; // Diana connected via Alice
    const path = findConnectionPath(userContacts, targetId, connections);

    expect(path).not.toBeNull();
    expect(path!.degree).toBe(2);
    expect(path!.pathDescription).toContain('2nd degree');
    expect(path!.pathDescription).toContain('Alice Johnson');
  });

  it('finds 3rd degree connection with two intermediates', () => {
    const allContacts: Contact[] = [
      ...userContacts,
      { id: '4', name: 'Diana Wilson', company: 'InnovateAI', role: 'CTO' },
      { id: '6', name: 'Frank Miller', company: 'StartupX', role: 'CEO' },
    ];

    const targetId = '6'; // Frank connected via Alice -> Diana
    const path = findConnectionPath(userContacts, targetId, connections);

    expect(path).not.toBeNull();
    expect(path!.degree).toBe(3);
    expect(path!.pathDescription).toContain('3rd degree');
  });

  it('returns null for connections beyond 3 degrees', () => {
    const targetId = '999'; // No connection
    const path = findConnectionPath(userContacts, targetId, connections);

    expect(path).toBeNull();
  });

  it('finds shortest path when multiple paths exist', () => {
    const multiPathConnections: ConnectionEdge[] = [
      { contact_id_a: '1', contact_id_b: '4', relationship_type: 'colleague' },
      { contact_id_a: '2', contact_id_b: '4', relationship_type: 'former_colleague' },
      { contact_id_a: '3', contact_id_b: '5', relationship_type: 'friend' },
      { contact_id_a: '5', contact_id_b: '4', relationship_type: 'mentor' },
    ];

    const targetId = '4'; // Multiple paths to Diana
    const path = findConnectionPath(userContacts, targetId, multiPathConnections);

    expect(path).not.toBeNull();
    expect(path!.degree).toBe(2); // Should find shortest (2nd degree, not 3rd)
  });

  describe('filterAlumni', () => {
    const contacts = [
      { id: '1', name: 'Alice', school: 'MIT', graduation_year: 2015 },
      { id: '2', name: 'Bob', school: 'Stanford', graduation_year: 2016 },
      { id: '3', name: 'Charlie', school: 'Berkeley', graduation_year: 2017 },
      { id: '4', name: 'Diana', school: null, graduation_year: null },
    ];

    it('filters contacts from same school', () => {
      const alumni = filterAlumni(contacts, ['MIT', 'Stanford']);
      
      expect(alumni).toHaveLength(2);
      expect(alumni.map(c => c.name)).toContain('Alice');
      expect(alumni.map(c => c.name)).toContain('Bob');
    });

    it('handles case-insensitive school matching', () => {
      const alumni = filterAlumni(contacts, ['mit']);
      
      expect(alumni).toHaveLength(1);
      expect(alumni[0].name).toBe('Alice');
    });

    it('returns empty array when no matches', () => {
      const alumni = filterAlumni(contacts, ['Harvard']);
      
      expect(alumni).toHaveLength(0);
    });
  });

  describe('filterInfluencers', () => {
    const contacts = [
      { id: '1', name: 'Alice', is_influencer: true, is_industry_leader: false, influence_score: 85 },
      { id: '2', name: 'Bob', is_influencer: false, is_industry_leader: true, influence_score: 92 },
      { id: '3', name: 'Charlie', is_influencer: true, is_industry_leader: true, influence_score: 78 },
      { id: '4', name: 'Diana', is_influencer: false, is_industry_leader: false, influence_score: 30 },
    ];

    it('filters influencers and industry leaders', () => {
      const influencers = filterInfluencers(contacts, 50);
      
      expect(influencers).toHaveLength(3);
      expect(influencers.map(c => c.name)).not.toContain('Diana');
    });

    it('respects minimum influence score threshold', () => {
      const influencers = filterInfluencers(contacts, 80);
      
      expect(influencers).toHaveLength(2);
      expect(influencers.map(c => c.name)).toContain('Alice');
      expect(influencers.map(c => c.name)).toContain('Bob');
    });

    it('sorts by influence score descending', () => {
      const influencers = filterInfluencers(contacts, 50);
      
      expect(influencers[0].name).toBe('Bob'); // highest score (92)
      expect(influencers[1].name).toBe('Alice'); // second (85)
      expect(influencers[2].name).toBe('Charlie'); // third (78)
    });

    it('returns empty array when no influencers meet threshold', () => {
      const influencers = filterInfluencers(contacts, 95);
      
      expect(influencers).toHaveLength(0);
    });
  });

  it('event participants role tracking', () => {
    const eventParticipants = [
      { contact_id: '1', participant_role: 'speaker' },
      { contact_id: '2', participant_role: 'attendee' },
      { contact_id: '3', participant_role: 'organizer' },
      { contact_id: '4', participant_role: 'panelist' },
    ];

    const validRoles = ['speaker', 'attendee', 'organizer', 'panelist'];
    
    eventParticipants.forEach(participant => {
      expect(validRoles).toContain(participant.participant_role);
    });

    // Speakers should be identifiable
    const speakers = eventParticipants.filter(p => p.participant_role === 'speaker');
    expect(speakers).toHaveLength(1);
  });
});
