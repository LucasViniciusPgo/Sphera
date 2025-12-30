import { getCurrentUser } from "@/hooks/useCurrentUser";
import { Arquivo, StatusType } from "@/interfaces/Arquivo";
import { http } from "@/lib/http";
import { ArquivoFormData } from "@/pages/documents/CadastroArquivo";


export async function createDocument(data: ArquivoFormData, file?: File | null) {
  const createdAt = new Date().toISOString();
  const newDocument: Arquivo = {
    id: crypto.randomUUID(),
    fileName: data.fileName,
    clientId: data.clientId,
    serviceId: data.serviceId,
    responsibleId: data.responsibleId,
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    notes: data.notes || "",
    file: file || undefined,
    createdBy: getCurrentUser(),
    createdAt,
    updatedBy: getCurrentUser(),
    updatedAt: createdAt
  };

  const createResponse = await http.post("/documents", newDocument);
  const document: Arquivo = createResponse.data;

  let uploadSuccess = true;
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    const uploadResponse = await http.post(`/documents/${createResponse.data.id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    uploadSuccess = uploadResponse.status == 201;
  }

  return { success: createResponse.status == 201 && uploadSuccess, document };
}

export async function updateDocument(
  id: string,
  existingDocument: Arquivo,
  data: ArquivoFormData,
  file?: File | null
) {
  const updatedAt = new Date().toISOString();
  const document = {
    ...data,
    id,
    createdBy: existingDocument.createdBy,
    createdAt: existingDocument.createdAt,
    updatedBy: getCurrentUser(),
    updatedAt
  } as Arquivo;

  const updateResponse = await http.put(`/documents/${id}`, document);

  let uploadSuccess = true;
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    const uploadResponse = await http.post(`/documents/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    uploadSuccess = uploadResponse.status == 201;
  }

  return { success: updateResponse.status == 200 && uploadSuccess, document };
}

export async function getDocumentById(id: string) {
  return (await http.get<Arquivo>(`/documents/${id}`)).data;
}

export async function getDocuments(params?: {
  partnerId?: string,
  clientId?: string,
  serviceId?: string,
  status?: StatusType,
  dueDateFrom?: string,
  dueDateTo?: string,
  search?: string,
  page?: number,
  pageSize?: number
}
) {
  const { partnerId, clientId, serviceId, status, dueDateFrom, dueDateTo, search, page, pageSize } = params || {};

  const actualParams: Record<string, any> = {};
  if (partnerId)
    actualParams.partnerId = partnerId;
  if (clientId)
    actualParams.clientId = clientId;
  if (serviceId)
    actualParams.serviceId = serviceId;
  if (status)
    actualParams.status = status;
  if (dueDateFrom)
    actualParams.dueDateFrom = dueDateFrom;
  if (dueDateTo)
    actualParams.dueDateTo = dueDateTo;
  if (search)
    actualParams.search = search;
  if (page !== undefined)
    actualParams.page = page;
  if (pageSize !== undefined)
    actualParams.pageSize = pageSize;

  const response = await http.get<Arquivo[]>("/documents", { params: actualParams });
  return response.data;
}

export async function deleteDocument(id: string) {
  return await (http.delete(`/documents/${id}`));
}

export async function downloadDocumentFile(id: string) {
  const response = await http.get<Blob>(`/documents/${id}/download`, { responseType: 'blob' });
  return response.data;
}