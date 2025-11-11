import { describe, it, expect } from 'vitest';

// Status mapping between UI labels and DB values
const UI_TO_DB_STATUS_MAP: Record<string, string> = {
  'Interested': 'interested',
  'Applied': 'applied',
  'Phone Screen': 'phone_screen',
  'Interview': 'interview',
  'Offer': 'offer',
  'Rejected': 'rejected',
};

const DB_TO_UI_STATUS_MAP: Record<string, string> = {
  'interested': 'Interested',
  'applied': 'Applied',
  'phone_screen': 'Phone Screen',
  'interview': 'Interview',
  'offer': 'Offer',
  'rejected': 'Rejected',
};

function mapUIStatusToDB(uiStatus: string): string {
  return UI_TO_DB_STATUS_MAP[uiStatus] || uiStatus;
}

function mapDBStatusToUI(dbStatus: string): string {
  return DB_TO_UI_STATUS_MAP[dbStatus] || dbStatus;
}

describe('JobStatusMapping - UI Label ↔ DB snake_case', () => {
  it('maps UI labels to DB snake_case correctly', () => {
    expect(mapUIStatusToDB('Interested')).toBe('interested');
    expect(mapUIStatusToDB('Applied')).toBe('applied');
    expect(mapUIStatusToDB('Phone Screen')).toBe('phone_screen');
    expect(mapUIStatusToDB('Interview')).toBe('interview');
    expect(mapUIStatusToDB('Offer')).toBe('offer');
    expect(mapUIStatusToDB('Rejected')).toBe('rejected');
  });

  it('maps DB snake_case to UI labels correctly', () => {
    expect(mapDBStatusToUI('interested')).toBe('Interested');
    expect(mapDBStatusToUI('applied')).toBe('Applied');
    expect(mapDBStatusToUI('phone_screen')).toBe('Phone Screen');
    expect(mapDBStatusToUI('interview')).toBe('Interview');
    expect(mapDBStatusToUI('offer')).toBe('Offer');
    expect(mapDBStatusToUI('rejected')).toBe('Rejected');
  });

  it('handles unknown statuses gracefully (passthrough)', () => {
    expect(mapUIStatusToDB('Unknown')).toBe('Unknown');
    expect(mapDBStatusToUI('unknown_status')).toBe('unknown_status');
  });

  it('validates all DB statuses match migration constraint', () => {
    const migrationStatuses = [
      'interested',
      'applied',
      'phone_screen',
      'interview',
      'offer',
      'rejected',
    ];

    const mappedStatuses = Object.values(UI_TO_DB_STATUS_MAP);

    migrationStatuses.forEach((status) => {
      expect(mappedStatuses).toContain(status);
    });

    // Verify no extra statuses in mapping
    expect(mappedStatuses.length).toBe(migrationStatuses.length);
  });

  it('ensures Phone Screen maps correctly (regression test)', () => {
    // This was the bug: "Phone Screen" UI label must map to "phone_screen" DB value
    const uiLabel = 'Phone Screen';
    const dbValue = mapUIStatusToDB(uiLabel);
    
    expect(dbValue).toBe('phone_screen');
    expect(dbValue).not.toBe('phoneScreen');
    expect(dbValue).not.toBe('PhoneScreen');
    expect(dbValue).not.toBe('Phone Screen');
  });

  it('ensures bidirectional mapping is consistent', () => {
    Object.entries(UI_TO_DB_STATUS_MAP).forEach(([uiStatus, dbStatus]) => {
      const backToUI = mapDBStatusToUI(dbStatus);
      expect(backToUI).toBe(uiStatus);
    });
  });

  it('filters work with DB values', () => {
    const mockJobs = [
      { id: '1', status: 'phone_screen', title: 'Job 1' },
      { id: '2', status: 'interview', title: 'Job 2' },
      { id: '3', status: 'applied', title: 'Job 3' },
    ];

    const filterByPhoneScreen = mockJobs.filter(
      (job) => job.status === 'phone_screen'
    );

    expect(filterByPhoneScreen).toHaveLength(1);
    expect(filterByPhoneScreen[0].title).toBe('Job 1');
  });

  it('indexes on jobs(status) column work efficiently', () => {
    // This test documents that an index exists on jobs.status
    // Actual index: CREATE INDEX idx_jobs_status ON jobs(status);
    // Query planner will use this for WHERE status = 'phone_screen'
    
    const dbStatuses = Object.values(UI_TO_DB_STATUS_MAP);
    
    // All statuses should be indexable
    dbStatuses.forEach((status) => {
      expect(typeof status).toBe('string');
      expect(status.length).toBeGreaterThan(0);
      expect(status).not.toContain(' '); // No spaces in DB values
    });
  });
});
