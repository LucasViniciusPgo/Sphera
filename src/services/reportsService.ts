import { http } from "@/lib/http";
import { EExpirationStatus, EDocumentProgressStatus, StatusType } from "@/interfaces/Arquivo";

export interface FileReportItem {
    fileName: string;
    partnerId: string;
    partnerName: string;
    clientId: string;
    clientName: string;
    serviceId: string;
    serviceName: string;
    responsibleId: string;
    responsibleName: string;
    dueDate: string;
    status: EExpirationStatus;
    progressStatus: EDocumentProgressStatus;
    notes?: string;
}

export interface FileReportParams {
    partnerId?: string;
    clientId?: string;
    serviceId?: string;
    status?: StatusType | "todos";
    fromDate?: string;
    toDate?: string;
    progressStatus?: string;
}

function convertStatusToEnum(status: StatusType): EExpirationStatus {
    switch (status) {
        case "vencido":
            return EExpirationStatus.Expired;
        case "a-vencer":
            return EExpirationStatus.AboutToExpire;
        case "dentro-prazo":
            return EExpirationStatus.WithinDeadline;
    }
}

export interface ClientsReportItem {
    tradeName: string;
    legalName: string;
    cnpj: string;
    partnerId: string;
    partnerName: string;
    ecacExpirationDate: string | null;
    status: EExpirationStatus | null;
    paymentStatus: number | null;
}

export interface ClientsReportParams {
    partnerId?: string;
    status?: string | "todos";
    paymentStatus?: string;
    fromDate?: string;
    toDate?: string;
    clientType?: number;
}

export async function getFilesReport(params: FileReportParams): Promise<FileReportItem[]> {
    const actualParams: Record<string, any> = {};
    if (params.partnerId) actualParams.PartnerId = params.partnerId;
    if (params.clientId) actualParams.ClientId = params.clientId;
    if (params.serviceId) actualParams.ServiceId = params.serviceId;
    if (params.status && params.status !== "todos") actualParams.Status = convertStatusToEnum(params.status);
    if (params.fromDate) actualParams.FromDate = params.fromDate;
    if (params.toDate) actualParams.ToDate = params.toDate;
    if (params.progressStatus && params.progressStatus !== "todos") actualParams.ProgressStatus = params.progressStatus;

    const response = await http.get<FileReportItem[]>("/Reports/Files", { params: actualParams });

    if ("status" in response && (response.status === 404)) {
        return [];
    }

    if ("message" in response && !("data" in response)) {
        throw new Error(response.message);
    }

    return (response as any).data || [];
}

export async function getClientsReport(params: ClientsReportParams): Promise<ClientsReportItem[]> {
    const actualParams: Record<string, any> = {};
    if (params.partnerId) actualParams.PartnerId = params.partnerId;
    if (params.status && params.status !== "todos") actualParams.Status = convertStatusToEnum(params.status as StatusType);
    if (params.paymentStatus) actualParams.PaymentStatus = params.paymentStatus;
    if (params.fromDate) actualParams.FromDate = params.fromDate;
    if (params.toDate) actualParams.ToDate = params.toDate;
    if (params.clientType !== undefined) actualParams.ClientType = params.clientType;

    const response = await http.get<ClientsReportItem[]>("/Reports/Clients", { params: actualParams });

    if ("status" in response && (response.status === 404)) {
        return [];
    }

    if ("message" in response && !("data" in response)) {
        throw new Error(response.message);
    }

    return (response as any).data || [];
}
