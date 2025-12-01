// UC-092: BFS-based connection path finding for 2nd/3rd degree connections

export interface Contact {
  id: string;
  name: string;
  company?: string | null;
  role?: string | null;
}

export interface ConnectionEdge {
  contact_id_a: string;
  contact_id_b: string;
  relationship_type?: string | null;
}

export interface ConnectionPath {
  target: Contact;
  path: Contact[];
  degree: 1 | 2 | 3;
  pathDescription: string;
}

/**
 * Find shortest path from user's contacts to target contact
 * using Breadth-First Search (BFS) up to depth 3
 */
export function findConnectionPath(
  userContacts: Contact[],
  targetContactId: string,
  allConnections: ConnectionEdge[]
): ConnectionPath | null {
  // Check if target is direct contact (1st degree)
  const directContact = userContacts.find(c => c.id === targetContactId);
  if (directContact) {
    return {
      target: directContact,
      path: [directContact],
      degree: 1,
      pathDescription: 'Direct connection',
    };
  }

  // Build adjacency list for BFS
  const adjacencyList = new Map<string, string[]>();
  for (const edge of allConnections) {
    if (!adjacencyList.has(edge.contact_id_a)) {
      adjacencyList.set(edge.contact_id_a, []);
    }
    if (!adjacencyList.has(edge.contact_id_b)) {
      adjacencyList.set(edge.contact_id_b, []);
    }
    adjacencyList.get(edge.contact_id_a)!.push(edge.contact_id_b);
    adjacencyList.get(edge.contact_id_b)!.push(edge.contact_id_a); // bidirectional
  }

  // Create contact lookup map
  const allContactsMap = new Map<string, Contact>();
  for (const contact of userContacts) {
    allContactsMap.set(contact.id, contact);
  }
  // Add connections as contacts (they may not be in user's direct contacts)
  for (const edge of allConnections) {
    // Contacts from connections would need to be fetched separately in real implementation
    // For now we'll mark them as intermediate
  }

  // BFS to find shortest path (max depth 3)
  const queue: { id: string; path: string[]; depth: number }[] = [];
  const visited = new Set<string>();

  // Start from all user's direct contacts
  for (const contact of userContacts) {
    queue.push({ id: contact.id, path: [contact.id], depth: 1 });
    visited.add(contact.id);
  }

  while (queue.length > 0) {
    const { id, path, depth } = queue.shift()!;

    // Max depth = 3 (3rd degree connection)
    if (depth > 3) {
      continue;
    }

    // Check if we reached target
    if (id === targetContactId) {
      // Reconstruct full path with contact details
      const contactPath: Contact[] = path
        .map(cId => allContactsMap.get(cId))
        .filter((c): c is Contact => c !== undefined);

      const degree = (depth as 1 | 2 | 3);
      const pathDescription = buildPathDescription(contactPath, degree);

      return {
        target: allContactsMap.get(targetContactId) || { id: targetContactId, name: 'Unknown' },
        path: contactPath,
        degree,
        pathDescription,
      };
    }

    // Explore neighbors
    const neighbors = adjacencyList.get(id) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({
          id: neighborId,
          path: [...path, neighborId],
          depth: depth + 1,
        });
      }
    }
  }

  return null; // No path found within 3 degrees
}

function buildPathDescription(path: Contact[], degree: 1 | 2 | 3): string {
  if (degree === 1) {
    return 'Direct connection';
  }
  
  if (degree === 2) {
    return `2nd degree via ${path[0].name}`;
  }

  if (degree === 3 && path.length >= 2) {
    return `3rd degree via ${path[0].name} → ${path[1].name}`;
  }

  return `${degree}-degree connection`;
}

/**
 * Filter contacts by alumni status
 */
export function filterAlumni(
  contacts: (Contact & { school?: string | null; graduation_year?: number | null })[],
  userSchools: string[]
): typeof contacts {
  return contacts.filter(contact => 
    contact.school && userSchools.some(school => 
      contact.school?.toLowerCase().includes(school.toLowerCase())
    )
  );
}

/**
 * Filter contacts by influencer/leader status
 */
export function filterInfluencers(
  contacts: (Contact & { is_influencer?: boolean; is_industry_leader?: boolean; influence_score?: number })[],
  minInfluenceScore: number = 50
): typeof contacts {
  return contacts.filter(contact => 
    (contact.is_influencer || contact.is_industry_leader) &&
    (contact.influence_score || 0) >= minInfluenceScore
  ).sort((a, b) => (b.influence_score || 0) - (a.influence_score || 0));
}
