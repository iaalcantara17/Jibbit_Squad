// Job status mapping between UI labels and DB snake_case values

export const UI_TO_DB_STATUS_MAP: Record<string, string> = {
  'Interested': 'interested',
  'Applied': 'applied',
  'Phone Screen': 'phone_screen',
  'Interview': 'interview',
  'Offer': 'offer',
  'Rejected': 'rejected',
};

export const DB_TO_UI_STATUS_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(UI_TO_DB_STATUS_MAP).map(([ui, db]) => [db, ui])
);

/**
 * Maps UI status label to database snake_case value
 * @param uiStatus - UI status label (e.g., "Phone Screen")
 * @returns Database status value (e.g., "phone_screen")
 */
export function mapUIStatusToDB(uiStatus: string): string {
  return UI_TO_DB_STATUS_MAP[uiStatus] || uiStatus;
}

/**
 * Maps database snake_case value to UI status label
 * @param dbStatus - Database status value (e.g., "phone_screen")
 * @returns UI status label (e.g., "Phone Screen")
 */
export function mapDBStatusToUI(dbStatus: string): string {
  return DB_TO_UI_STATUS_MAP[dbStatus] || dbStatus;
}
