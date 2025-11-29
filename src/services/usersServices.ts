import { Usuario } from "@/interfaces/Usuario";
import { http } from "@/lib/http";

export async function getUsers(params?: {
  email?: string,
  isActive?: string,
  roleId?: number,
  page?: number,
  pageSize?: number
}
) {
  const { email, isActive, roleId, page, pageSize } = params || {};
  const actualParams: Record<string, any> = {};
  if (email)
    actualParams.email = email;
  if (isActive)
    actualParams.isActive = isActive;
  if (roleId !== undefined)
    actualParams.roleId = roleId;
  if (page !== undefined)
    actualParams.page = page;
  if (pageSize !== undefined)
    actualParams.pageSize = pageSize;

  const response = await http.get<Usuario[]>("/users", { params: actualParams });
  return response.data;
}
