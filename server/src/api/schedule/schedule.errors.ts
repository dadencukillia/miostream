import { ErrorsSet } from "@utils/errorsCollection";

export const ScheduleErrors = new ErrorsSet("schedule", {
    // DB
    "schedule-db-invalid-error": [400, "data does not satisfy database"],
    "schedule-db-data-not-found": [404, "referenced data does not exist"],
    "schedule-db-error": [500, "database operation failed"],

    // Request
    "schedule-invalid": [400, "invalid payload"],
    "schedule-invalid-date": [400, "invalid calendar date"],
    "schedule-episode-not-found": [404, "upcoming episode not found"],

    // Conflict
    "schedule-episode-already-exists": [409, "episode already exists in the schedule"],
});