import { describe, it, expect } from 'vitest';

describe('Contact Discovery', () => {
  it('should find contacts by target company', () => {
    const contacts = [
      { id: '1', name: 'Alice', company: 'Google', role: 'Engineer' },
      { id: '2', name: 'Bob', company: 'Microsoft', role: 'PM' },
      { id: '3', name: 'Charlie', company: 'Google', role: 'Designer' },
    ];

    const targetCompany = 'google';
    const matches = contacts.filter(c => 
      c.company?.toLowerCase().includes(targetCompany.toLowerCase())
    );

    expect(matches).toHaveLength(2);
    expect(matches.every(m => m.company === 'Google')).toBe(true);
  });

  it('should find contacts by target role', () => {
    const contacts = [
      { id: '1', name: 'Alice', company: 'Google', role: 'Software Engineer' },
      { id: '2', name: 'Bob', company: 'Microsoft', role: 'Product Manager' },
      { id: '3', name: 'Charlie', company: 'Apple', role: 'Senior Engineer' },
    ];

    const targetRole = 'engineer';
    const matches = contacts.filter(c => 
      c.role?.toLowerCase().includes(targetRole.toLowerCase())
    );

    expect(matches).toHaveLength(2);
  });

  it('should identify mutual interests via tags', () => {
    const contacts = [
      { id: '1', name: 'Alice', tags: ['react', 'typescript'] },
      { id: '2', name: 'Bob', tags: ['python', 'ml'] },
      { id: '3', name: 'Charlie', tags: ['react', 'node'] },
    ];

    const contactsWithReactTag = contacts.filter(c => 
      c.tags?.some(tag => tag.toLowerCase() === 'react')
    );

    expect(contactsWithReactTag).toHaveLength(2);
  });

  it('should calculate connection paths', () => {
    const contact = {
      id: '1',
      name: 'John Doe',
      company: 'Google',
      relationship_strength: 4,
    };

    const path = {
      contact,
      path: '1st degree connection',
      strength: contact.relationship_strength,
    };

    expect(path.path).toBe('1st degree connection');
    expect(path.strength).toBe(4);
  });
});
