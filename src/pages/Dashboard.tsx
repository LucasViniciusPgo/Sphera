import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 10;
    const [filterAction, setFilterAction] = useState<string>("all");
    const [filterEntity, setFilterEntity] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState<string>(""); // yyyy-MM-dd
    const [dateTo, setDateTo] = useState<string>("");     // yyyy-MM-dd

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mounted = useRef(false);

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

    const parseUtcDate = (timestamp: string) => {
        // Treat timestamps without explicit timezone as UTC
        const hasTimeZone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(timestamp);
        const ts = hasTimeZone ? timestamp : `${timestamp}Z`;
        return new Date(ts);
    };

    const loadAuditories = useCallback(async (pageParam: number, searchParam: string, actionParam: string, entityParam: string, fromParam: string, toParam: string) => {
        setLoading(true);
        setError(null);
        try {
            let occurredAtStart: string | undefined;
            let occurredAtEnd: string | undefined;

            if (fromParam) {
                occurredAtStart = new Date(`${fromParam}T00:00:00`).toISOString();
            }
            if (toParam) {
                occurredAtEnd = new Date(`${toParam}T23:59:59`).toISOString();
            }

            const params: GetAuditoriesParams = {
                occurredAtStart,
                occurredAtEnd,
                page: pageParam,
                pageSize,
                search: searchParam || undefined,
            };

            if (actionParam !== "all") {
                params.action = actionParam;
            }
            if (entityParam !== "all") {
                params.entityType = entityParam;
            }

            const { items } = await getAuditories(params);

            // ordena por data decrescente
            const sorted = [...items].sort(
                (a, b) =>
                    parseUtcDate(b.occurredAt).getTime() - parseUtcDate(a.occurredAt).getTime(),
            );

            setAuditLogs(sorted);
            setHasMore(items.length >= pageSize);
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
    }, []);

    // Debounce search
    useEffect(() => {
        if (!mounted.current) return;

        const timer = setTimeout(() => {
            if (page === 1) {
                loadAuditories(1, searchTerm, filterAction, filterEntity, dateFrom, dateTo);
            } else {
                setPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset page to 1 on filter changes
    useEffect(() => {
        if (!mounted.current) return;

        if (page === 1) {
            loadAuditories(1, searchTerm, filterAction, filterEntity, dateFrom, dateTo);
        } else {
            setPage(1);
        }
    }, [filterAction, filterEntity, dateFrom, dateTo]);

    // Main page effect
    useEffect(() => {
        loadAuditories(page, searchTerm, filterAction, filterEntity, dateFrom, dateTo);
    }, [page, loadAuditories]);

    // Set mounted flag
    useEffect(() => {
        mounted.current = true;
    }, []);

    // Removed client-side filtering as logic moved to backend
    const filteredLogs = auditLogs;

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
        const date = parseUtcDate(timestamp);
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
                        onClick={() => void loadAuditories(page, searchTerm, filterAction, filterEntity, dateFrom, dateTo)}
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
                                placeholder="Buscar (Enter para pesquisar)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setPage(1);
                                        void loadAuditories(1, searchTerm, filterAction, filterEntity, dateFrom, dateTo);
                                    }
                                }}
                            />
                        </div>

                        {/* Ação */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ação</label>
                            <Select
                                value={filterAction}
                                onValueChange={(val) => {
                                    setFilterAction(val);
                                    setPage(1);
                                }}
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
                                onValueChange={(val) => {
                                    setFilterEntity(val);
                                    setPage(1);
                                }}
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
                                    onChange={(e) => {
                                        setDateFrom(e.target.value);
                                        setPage(1);
                                    }}
                                />
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => {
                                        setDateTo(e.target.value);
                                        setPage(1);
                                    }}
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
                                    <TableHead>Nome</TableHead>
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
                                            <TableCell className="text-sm">
                                                {log.entityName || "-"}
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

            {/* Paginação */}
            <div className="flex justify-center">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>

                        <PaginationItem>
                            <PaginationLink isActive>{page}</PaginationLink>
                        </PaginationItem>

                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setPage(p => p + 1)}
                                className={!hasMore ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
};

export default Dashboard;