import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, UserPlus, Users, Edit, Trash2, Upload } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface AuditLog {
  id: string;
  action: "create" | "update" | "delete" | "upload";
  entityType: "parceiro" | "cliente" | "servico" | "arquivo";
  entityName: string;
  entityId: string;
  user: string;
  timestamp: string;
}

const Dashboard = () => {
  const { currentUser } = useCurrentUser();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");

  useEffect(() => {
    const logs: AuditLog[] = [];

    // Carregar parceiros
    const parceiros = JSON.parse(localStorage.getItem("parceiros") || "[]");
    parceiros.forEach((p: any) => {
      if (p.createdAt) {
        logs.push({
          id: `${p.id}-create`,
          action: "create",
          entityType: "parceiro",
          entityName: p.razaoSocial,
          entityId: p.id,
          user: p.createdBy || "Sistema",
          timestamp: p.createdAt,
        });
      }
      if (p.updatedAt && p.updatedAt !== p.createdAt) {
        logs.push({
          id: `${p.id}-update-${p.updatedAt}`,
          action: "update",
          entityType: "parceiro",
          entityName: p.nomeFantasia,
          entityId: p.id,
          user: p.updatedBy || "Sistema",
          timestamp: p.updatedAt,
        });
      }
    });

    // Carregar clientes
    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");
    clientes.forEach((c: any) => {
      if (c.createdAt) {
        logs.push({
          id: `${c.id}-create`,
          action: "create",
          entityType: "cliente",
          entityName: c.nomeFantasia,
          entityId: c.id,
          user: c.createdBy || "Sistema",
          timestamp: c.createdAt,
        });
      }
      if (c.updatedAt && c.updatedAt !== c.createdAt) {
        logs.push({
          id: `${c.id}-update-${c.updatedAt}`,
          action: "update",
          entityType: "cliente",
          entityName: c.nomeFantasia,
          entityId: c.id,
          user: c.updatedBy || "Sistema",
          timestamp: c.updatedAt,
        });
      }
    });

    // Carregar serviços
    const servicos = JSON.parse(localStorage.getItem("servicos") || "[]");
    servicos.forEach((s: any) => {
      if (s.createdAt) {
        logs.push({
          id: `${s.id}-create`,
          action: "create",
          entityType: "servico",
          entityName: s.nomeServico,
          entityId: s.id,
          user: s.createdBy || "Sistema",
          timestamp: s.createdAt,
        });
      }
      if (s.updatedAt && s.updatedAt !== s.createdAt) {
        logs.push({
          id: `${s.id}-update-${s.updatedAt}`,
          action: "update",
          entityType: "servico",
          entityName: s.nomeServico,
          entityId: s.id,
          user: s.updatedBy || "Sistema",
          timestamp: s.updatedAt,
        });
      }
    });

    // Carregar arquivos
    const arquivos = JSON.parse(localStorage.getItem("arquivos") || "[]");
    arquivos.forEach((a: any) => {
      if (a.createdAt) {
        logs.push({
          id: `${a.id}-upload`,
          action: "upload",
          entityType: "arquivo",
          entityName: a.NomeArquivo,
          entityId: a.id,
          user: a.createdBy || "Sistema",
          timestamp: a.createdAt,
        });
      }
      if (a.updatedAt && a.updatedAt !== a.createdAt) {
        logs.push({
          id: `${a.id}-update-${a.updatedAt}`,
          action: "update",
          entityType: "arquivo",
          entityName: a.NomeArquivo,
          entityId: a.id,
          user: a.updatedBy || "Sistema",
          timestamp: a.updatedAt,
        });
      }
    });

    // Backfill: garantir que create/update atuais existam em auditLogs persistidos
    const existingPersisted: AuditLog[] = JSON.parse(localStorage.getItem("auditLogs") || "[]");
    const existingIds = new Set(existingPersisted.map(l => l.id));
    const toPersist: AuditLog[] = [];
    for (const l of logs) {
      if ((l.action === 'create' || l.action === 'update') && !existingIds.has(l.id)) {
        toPersist.push(l);
      }
    }
    if (toPersist.length) {
      const updated = [...existingPersisted, ...toPersist];
      localStorage.setItem("auditLogs", JSON.stringify(updated));
      existingPersisted.push(...toPersist);
    }

    // Carregar logs persistidos (exclusões e qualquer outro já salvo)
    for (const pl of existingPersisted) {
      if (!logs.find(l => l.id === pl.id)) {
        logs.push(pl);
      }
    }

    // Ordenar por timestamp decrescente
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setAuditLogs(logs);
    setFilteredLogs(logs);
  }, []);

  useEffect(() => {
    let filtered = auditLogs;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por ação
    if (filterAction !== "all") {
      filtered = filtered.filter((log) => log.action === filterAction);
    }

    // Filtrar por tipo de entidade
    if (filterEntity !== "all") {
      filtered = filtered.filter((log) => log.entityType === filterEntity);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, filterAction, filterEntity, auditLogs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <UserPlus className="h-4 w-4" />;
      case "update":
        return <Edit className="h-4 w-4" />;
      case "delete":
        return <Trash2 className="h-4 w-4" />;
      case "upload":
        return <Upload className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: "Criado",
      update: "Atualizado",
      delete: "Excluído",
      upload: "Upload",
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      parceiro: "Parceiro",
      cliente: "Cliente",
      servico: "Serviço",
      arquivo: "Arquivo",
    };
    return labels[entityType] || entityType;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rastreamento de Atividades</h1>
        <p className="text-muted-foreground mt-2">
          Histórico completo de ações realizadas no sistema
        </p>
        {currentUser && (
          <p className="text-sm text-muted-foreground mt-1">
            Usuário logado: <span className="font-medium">{currentUser}</span>
          </p>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Nome ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ação</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="create">Criado</SelectItem>
                  <SelectItem value="update">Atualizado</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                  <SelectItem value="delete">Excluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="parceiro">Parceiros</SelectItem>
                  <SelectItem value="cliente">Clientes</SelectItem>
                  <SelectItem value="servico">Serviços</SelectItem>
                  <SelectItem value="arquivo">Arquivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atividades ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma atividade encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span>{getActionLabel(log.action)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getEntityLabel(log.entityType)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.entityName}</TableCell>
                      <TableCell>{log.user}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
