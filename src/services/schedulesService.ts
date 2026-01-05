import { http } from "@/lib/http";

export interface ScheduleEvent {
    id: string;
    occurredAt: string;
    userId?: string;
    clientId?: string;
    notes?: string | null;
    eventType: number;
    createdAt: string;
    createdBy: string;
    updatedAt?: string | null;
    updatedBy?: string | null;
}

export interface CreateScheduleEventCommand {
    occurredAt: string;
    userId?: string;
    clientId?: string;
    notes?: string | null;
    eventType: number;
}

export type UpdateScheduleEventCommand = CreateScheduleEventCommand;

export async function getUserScheduleEvents(
    userId: string,
    params?: { startAt?: string; endAt?: string; eventType?: number }
) {
    const { startAt, endAt, eventType } = params || {};
    const res = await http.get<ScheduleEvent[]>(`Schedules/user/${userId}`, {
        params: {
            StartAt: startAt,
            EndAt: endAt,
            EventType: eventType,
        },
    });
    return res.data;
}

export async function getScheduleEvents(params?: {
    startAt?: string;
    endAt?: string;
    eventType?: number;
    createdBy?: string;
}) {
    const { startAt, endAt, eventType, createdBy } = params || {};
    const query: Record<string, any> = {};

    if (startAt) query.StartAt = startAt;
    if (endAt) query.EndAt = endAt;
    if (eventType !== undefined) query.EventType = eventType;
    if (createdBy) query.CreatedBy = createdBy;

    const res = await http.get<ScheduleEvent[]>("Schedules", {
        params: query,
    });

    return res.data;
}

export async function createScheduleEvent(
    payload: CreateScheduleEventCommand
) {
    const res = await http.post<ScheduleEvent>("Schedules", payload);
    return res.data;
}

export async function updateScheduleEvent(
    id: string,
    payload: UpdateScheduleEventCommand
) {
    const res = await http.put<ScheduleEvent>(`Schedules/${id}`, payload);
    return res.data;
}

export async function deleteScheduleEvent(id: string) {
    await http.delete(`Schedules/${id}`);
}
