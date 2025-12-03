import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    FileText,
    UserPlus,
    Users,
    Edit,
    Trash2,
    Upload,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
    getAuditories,
    type AuditoryDTO,
    type GetAuditoriesParams,
} from "@/services/auditoryService";

const Dashboard = () => {
    const { currentUser } = useCurrentUser();

    const [auditLogs, setAuditLogs] = useState<AuditoryDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAction, setFilterAction] = useState<string>("all");
    const [filterEntity, setFilterEntity] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState<string>(""); // yyyy-MM-dd
    const [dateTo, setDateTo] = useState<string>("");     // yyyy-MM-dd

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const buildDateTimeRange = () => {
        let occurredAtStart: string | undefined;
        let occurredAtEnd: string | undefined;

        if (dateFrom) {
            occurredAtStart = new Date(`${dateFrom}T00:00:00`).toISOString();
        }
        if (dateTo) {
            occurredAtEnd = new Date(`${dateTo}T23:59:59`).toISOString();
        }

        return { occurredAtStart, occurredAtEnd };
    };

    const loadAuditories = async () => {
        setLoading(true);
        setError(null);
        try {
            const { occurredAtStart, occurredAtEnd } = buildDateTimeRange();

            const params: GetAuditoriesParams = {
                occurredAtStart,
                occurredAtEnd,
            };

            if (filterAction !== "all") {
                params.action = filterAction;
            }
            if (filterEntity !== "all") {
                params.entityType = filterEntity;
            }

            const { items } = await getAuditories(params);

            // ordena por data decrescente
            const sorted = [...items].sort(
                (a, b) =>
                    new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
            );

            setAuditLogs(sorted);
        } catch (e: any) {
            console.error(e);
            setError(
                e?.response?.data?.message ||
                e?.message ||
                "Erro ao carregar histórico de atividades.",
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        void loadAuditories();
    }, [filterAction, filterEntity, dateFrom, dateTo]);


    const filteredLogs = useMemo(() => {
        let logs = auditLogs;

        if (filterAction !== "all") {
            logs = logs.filter((log) => log.action === filterAction);
        }
        if (filterEntity !== "all") {
            logs = logs.filter((log) => log.entityType === filterEntity);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            logs = logs.filter((log) => {
                return (
                    log.actorEmail?.toLowerCase().includes(term) ||
                    log.actorName?.toLowerCase().includes(term) ||
                    log.action?.toLowerCase().includes(term) ||
                    log.entityType?.toLowerCase().includes(term)
                );
            });
        }

        return logs;
    }, [auditLogs, searchTerm, filterAction, filterEntity]);

    const getActionIcon = (action: string) => {
        switch (action.toLowerCase()) {
            case "create":
            case "created":
                return <UserPlus className="h-4 w-4" />;
            case "update":
            case "updated":
                return <Edit className="h-4 w-4" />;
            case "delete":
            case "deleted":
                return <Trash2 className="h-4 w-4" />;
            case "upload":
                return <Upload className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getActionLabel = (action: string) => {
        const normalized = action.toLowerCase();
        const labels: Record<string, string> = {
            added: "Criado",
            create: "Criado",
            created: "Criado",
            update: "Atualizado",
            updated: "Atualizado",
            modified: "Atualizado",
            delete: "Excluído",
            deleted: "Excluído",
            upload: "Upload",
        };
        return labels[normalized] || action;
    };

    const getEntityLabel = (entityType: string) => {
        const normalized = entityType.toLowerCase();
        const labels: Record<string, string> = {
            parceiro: "Parceiro",
            partner: "Parceiro",
            cliente: "Cliente",
            client: "Cliente",
            servico: "Serviço",
            service: "Serviço",
            arquivo: "Arquivo",
            document: "Documento",
            user: "Usuário",
            scheduleevent: "Agenda",
            contact: "Contato",
            addressvalueobject: "Endereço",
        };

        return labels[normalized] || entityType;
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return timestamp;

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
                <h1 className="text-3xl font-bold text-foreground">
                    Rastreamento de Atividades
                </h1>
                <p className="text-muted-foreground mt-2">
                    Histórico completo de ações realizadas no sistema por todos os usuários.
                </p>
                {currentUser && (
                    <p className="text-sm text-muted-foreground mt-1">
                        Usuário logado: <span className="font-medium">{currentUser}</span>
                    </p>
                )}
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>Filtros</CardTitle>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void loadAuditories()}
                        disabled={loading}
                        title="Recarregar"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                        />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Busca */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar</label>
                            <Input
                                placeholder="Email, ação, tipo ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Ação */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ação</label>
                            <Select
                                value={filterAction}
                                onValueChange={setFilterAction}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="Added">Criado</SelectItem>
                                    <SelectItem value="Modified">Atualizado</SelectItem>
                                    <SelectItem value="Deleted">Excluído</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tipo (EntityType) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <Select
                                value={filterEntity}
                                onValueChange={setFilterEntity}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="Partner">Parceiros</SelectItem>
                                    <SelectItem value="Client">Clientes</SelectItem>
                                    <SelectItem value="Service">Serviços</SelectItem>
                                    <SelectItem value="User">Usuários</SelectItem>
                                    <SelectItem value="Document">Documentos</SelectItem>
                                    <SelectItem value="ScheduleEvent">Agenda</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Período */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Período</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabela de Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Histórico de Atividades{" "}
                        {loading
                            ? "(carregando...)"
                            : filteredLogs.length > 0
                                ? `(${filteredLogs.length})`
                                : ""}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>E-mail</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center text-muted-foreground py-6"
                                        >
                                            Carregando atividades...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center text-muted-foreground py-6"
                                        >
                                            Nenhuma atividade encontrada
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-sm">
                                                {formatDate(log.occurredAt)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getActionIcon(log.action)}
                                                    <span>{getActionLabel(log.action)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {getEntityLabel(log.entityType)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {log.actorName}
                                            </TableCell>
                                            <TableCell>{log.actorEmail}</TableCell>
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