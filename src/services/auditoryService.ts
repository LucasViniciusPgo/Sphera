// src/services/auditoryService.ts
import { http } from "@/lib/http";

export interface AuditoryDTO {
    id: number;
    occurredAt: string;   // ISO date-time
    actorId: string;      // Guid
    action: string;
    entityType: string;
    entityName?: string;
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
    search?: string;
    page?: number;
    pageSize?: number;
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
        search,
        page,
        pageSize,
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
            Search: search,
            Page: page,
            PageSize: pageSize,
        },
    });

    const raw = res.data;

    let items: AuditoryDTO[] = [];
    let totalCount = 0;

    if (Array.isArray(raw)) {
        items = raw;
        totalCount = raw.length;
    } else if ((raw as any)?.items) {
        items = (raw as any).items;
        totalCount = (raw as any).totalCount || (raw as any).total || 0;
    }

    // Fallback if totalCount is missing but we have items (e.g. non-paginated legacy response)
    if (totalCount === 0 && items.length > 0) {
        totalCount = items.length;
    }

    return { items, raw, totalCount };
}