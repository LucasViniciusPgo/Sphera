import { http } from "@/lib/http";

export interface ScheduleEvent {
    id: string;
    occurredAt: string;
    userId: string;
    clientId: string;
    notes?: string | null;
    createdAt: string;
    createdBy: string;
    updatedAt?: string | null;
    updatedBy?: string | null;
}

export interface CreateScheduleEventCommand {
    occurredAt: string; // ISO string
    userId: string;     // GUID do usuário
    clientId: string;   // GUID do cliente
    notes?: string | null;
}

// mesma estrutura do CreateScheduleEventCommand na API :contentReference[oaicite:2]{index=2}
export type UpdateScheduleEventCommand = CreateScheduleEventCommand;

// GET /api/v1/Schedules/user/{userId}?StartAt=&EndAt=
export async function getUserScheduleEvents(
    userId: string,
    params?: { startAt?: string; endAt?: string }
) {
    const { startAt, endAt } = params || {};
    const res = await http.get<ScheduleEvent[]>(`Schedules/user/${userId}`, {
        params: {
            StartAt: startAt,
            EndAt: endAt,
        },
    });
    return res.data;
}

// POST /api/v1/Schedules
export async function createScheduleEvent(
    payload: CreateScheduleEventCommand
) {
    const res = await http.post<ScheduleEvent>("Schedules", payload);
    return res.data;
}

// PUT /api/v1/Schedules/{id}
export async function updateScheduleEvent(
    id: string,
    payload: UpdateScheduleEventCommand
) {
    const res = await http.put<ScheduleEvent>(`Schedules/${id}`, payload);
    return res.data;
}

// DELETE /api/v1/Schedules/{id}
export async function deleteScheduleEvent(id: string) {
    await http.delete(`Schedules/${id}`);
}
