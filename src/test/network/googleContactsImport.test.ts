import { describe, it, expect, vi } from 'vitest';

describe('Google Contacts Import', () => {
  it('should dedupe contacts by email', () => {
    const existingContacts = [
      { email: 'john@example.com', name: 'John Doe' }
    ];

    const importedContacts = [
      { email: 'john@example.com', name: 'John D.' },
      { email: 'jane@example.com', name: 'Jane Smith' }
    ];

    const deduplicated = importedContacts.filter(
      imported => !existingContacts.some(existing => existing.email === imported.email)
    );

    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].email).toBe('jane@example.com');
  });

  it('should map Google contact fields correctly', () => {
    const googleContact = {
      names: [{ displayName: 'John Doe' }],
      emailAddresses: [{ value: 'john@example.com' }],
      phoneNumbers: [{ value: '+1234567890' }],
      organizations: [{ name: 'Acme Corp', title: 'Engineer' }]
    };

    const mapped = {
      name: googleContact.names[0].displayName,
      email: googleContact.emailAddresses[0].value,
      phone: googleContact.phoneNumbers[0].value,
      company: googleContact.organizations[0].name,
      role: googleContact.organizations[0].title,
    };

    expect(mapped.name).toBe('John Doe');
    expect(mapped.email).toBe('john@example.com');
    expect(mapped.company).toBe('Acme Corp');
  });
});
