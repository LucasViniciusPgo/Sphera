import { Servico } from "@/interfaces/Servico";
import { http } from "@/lib/http";

export async function getServices(params?: {
  code?: string,
  name?: string,
  isActive?: string
}
) {
  const { code, name, isActive } = params || {};
  const actualParams: Record<string, any> = {};
  if (code)
    actualParams.code = code;
  if (name)
    actualParams.name = name;
  if (isActive)
    actualParams.isActive = isActive;

  const response = await http.get<Servico[]>("/services", { params: actualParams });
  return response.data;
}
