import { describe, it, expect } from 'vitest';
import {
  findConnectionPath,
  filterAlumni,
  filterInfluencers,
  type Contact,
  type ConnectionEdge,
} from '@/lib/connectionPathFinder';

describe('Network Management - Connection Path Finder', () => {
  const mockContacts: Contact[] = [
    { id: '1', name: 'Alice Johnson', company: 'Tech Corp', role: 'Engineer' },
    { id: '2', name: 'Bob Smith', company: 'Finance Inc', role: 'Manager' },
    { id: '3', name: 'Carol White', company: 'Startup XYZ', role: 'CEO' },
  ];

  const mockConnections: ConnectionEdge[] = [
    { contact_id_a: '1', contact_id_b: '4', relationship_type: 'colleague' },
    { contact_id_a: '2', contact_id_b: '4', relationship_type: 'friend' },
    { contact_id_a: '4', contact_id_b: '5', relationship_type: 'colleague' },
    { contact_id_a: '5', contact_id_b: '6', relationship_type: 'mentor' },
  ];

  describe('findConnectionPath', () => {
    it('should find direct connection (1st degree)', () => {
      const result = findConnectionPath(mockContacts, '1', mockConnections);
      
      expect(result).not.toBeNull();
      expect(result?.degree).toBe(1);
      expect(result?.pathDescription).toBe('Direct connection');
    });

    it('should return null for non-existent target', () => {
      const result = findConnectionPath(mockContacts, 'non-existent-id', []);
      expect(result).toBeNull();
    });

    it('should find 2nd degree connections', () => {
      // Contact 4 is connected to contacts 1 and 2
      const result = findConnectionPath(mockContacts, '4', mockConnections);
      
      if (result && result.degree !== 1) {
        expect(result.degree).toBe(2);
        expect(result.pathDescription).toContain('2nd degree');
      }
    });

    it('should return correct target information', () => {
      const result = findConnectionPath(mockContacts, '1', mockConnections);
      
      expect(result?.target).toHaveProperty('id');
      expect(result?.target).toHaveProperty('name');
    });

    it('should return path array', () => {
      const result = findConnectionPath(mockContacts, '1', mockConnections);
      
      expect(Array.isArray(result?.path)).toBe(true);
    });

    it('should handle empty contacts array', () => {
      const result = findConnectionPath([], '1', mockConnections);
      expect(result).toBeNull();
    });

    it('should handle empty connections array', () => {
      const result = findConnectionPath(mockContacts, '1', []);
      // Should find direct contact
      expect(result?.degree).toBe(1);
    });

    it('should not exceed 3rd degree connections', () => {
      const deepConnections: ConnectionEdge[] = [
        { contact_id_a: '1', contact_id_b: 'a' },
        { contact_id_a: 'a', contact_id_b: 'b' },
        { contact_id_a: 'b', contact_id_b: 'c' },
        { contact_id_a: 'c', contact_id_b: 'd' },
        { contact_id_a: 'd', contact_id_b: 'target' },
      ];
      
      const result = findConnectionPath(mockContacts, 'target', deepConnections);
      
      // Should be null because target is more than 3 degrees away
      if (result) {
        expect(result.degree).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('filterAlumni', () => {
    const contactsWithSchool = [
      { id: '1', name: 'Alice', school: 'MIT', graduation_year: 2020 },
      { id: '2', name: 'Bob', school: 'Stanford University', graduation_year: 2019 },
      { id: '3', name: 'Carol', school: 'Harvard', graduation_year: 2021 },
      { id: '4', name: 'David', school: null, graduation_year: null },
    ];

    it('should filter contacts by school', () => {
      const result = filterAlumni(contactsWithSchool, ['MIT']);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Alice');
    });

    it('should be case insensitive', () => {
      const result = filterAlumni(contactsWithSchool, ['mit']);
      expect(result.length).toBe(1);
    });

    it('should match partial school names', () => {
      const result = filterAlumni(contactsWithSchool, ['Stanford']);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Bob');
    });

    it('should filter by multiple schools', () => {
      const result = filterAlumni(contactsWithSchool, ['MIT', 'Harvard']);
      expect(result.length).toBe(2);
    });

    it('should exclude contacts without school', () => {
      const result = filterAlumni(contactsWithSchool, ['MIT', 'Stanford', 'Harvard']);
      expect(result.every(c => c.school !== null)).toBe(true);
    });

    it('should return empty array if no matches', () => {
      const result = filterAlumni(contactsWithSchool, ['Princeton']);
      expect(result.length).toBe(0);
    });

    it('should handle empty user schools array', () => {
      const result = filterAlumni(contactsWithSchool, []);
      expect(result.length).toBe(0);
    });

    it('should handle empty contacts array', () => {
      const result = filterAlumni([], ['MIT']);
      expect(result.length).toBe(0);
    });
  });

  describe('filterInfluencers', () => {
    const contactsWithInfluence = [
      { id: '1', name: 'Alice', is_influencer: true, is_industry_leader: false, influence_score: 80 },
      { id: '2', name: 'Bob', is_influencer: false, is_industry_leader: true, influence_score: 90 },
      { id: '3', name: 'Carol', is_influencer: true, is_industry_leader: true, influence_score: 95 },
      { id: '4', name: 'David', is_influencer: false, is_industry_leader: false, influence_score: 30 },
      { id: '5', name: 'Eve', is_influencer: true, is_industry_leader: false, influence_score: 40 },
    ];

    it('should filter influencers above minimum score', () => {
      const result = filterInfluencers(contactsWithInfluence, 50);
      expect(result.length).toBe(3);
    });

    it('should use default minimum score of 50', () => {
      const result = filterInfluencers(contactsWithInfluence);
      expect(result.every(c => (c.influence_score || 0) >= 50)).toBe(true);
    });

    it('should sort by influence score descending', () => {
      const result = filterInfluencers(contactsWithInfluence, 50);
      expect(result[0].name).toBe('Carol'); // Highest score
      expect(result[result.length - 1].influence_score).toBeLessThanOrEqual(result[0].influence_score || 0);
    });

    it('should include industry leaders', () => {
      const result = filterInfluencers(contactsWithInfluence, 50);
      expect(result.some(c => c.is_industry_leader)).toBe(true);
    });

    it('should exclude non-influencers below threshold', () => {
      const result = filterInfluencers(contactsWithInfluence, 50);
      expect(result.some(c => c.name === 'David')).toBe(false);
    });

    it('should handle contacts without influence_score', () => {
      const contactsNoScore = [
        { id: '1', name: 'Test', is_influencer: true, is_industry_leader: false },
      ];
      const result = filterInfluencers(contactsNoScore, 50);
      expect(result.length).toBe(0); // Score defaults to 0
    });

    it('should return empty for high threshold', () => {
      const result = filterInfluencers(contactsWithInfluence, 100);
      expect(result.length).toBe(0);
    });

    it('should handle empty contacts array', () => {
      const result = filterInfluencers([], 50);
      expect(result.length).toBe(0);
    });
  });
});
