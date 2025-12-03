// src/services/auditoryService.ts
import { http } from "@/lib/http";

export interface AuditoryDTO {
    id: number;
    occurredAt: string;   // ISO date-time
    actorId: string;      // Guid
    action: string;
    entityType: string;
    entityId?: string | null;
    requestIp: string;
    actorEmail: string;
    actorName: string;
}

export interface GetAuditoriesParams {
    id?: number;
    occurredAtStart?: string; // ISO date-time
    occurredAtEnd?: string;   // ISO date-time
    actorId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
}

export async function getAuditories(params?: GetAuditoriesParams) {
    const {
        id,
        occurredAtStart,
        occurredAtEnd,
        actorId,
        action,
        entityType,
        entityId,
    } = params || {};

    const res = await http.get<AuditoryDTO[] | { items: AuditoryDTO[] }>("Auditory", {
        params: {
            Id: id,
            OccurredAtStart: occurredAtStart,
            OccurredAtEnd: occurredAtEnd,
            ActorId: actorId,
            Action: action,
            EntityType: entityType,
            EntityId: entityId,
        },
    });

    const raw = res.data;
    const items: AuditoryDTO[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.items)
            ? (raw as any).items
            : [];

    return { items, raw };
}