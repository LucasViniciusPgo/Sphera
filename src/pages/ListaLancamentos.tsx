import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Plus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBillingEntries, type BillingEntry } from "@/services/billingEntriesService";
import { getClients, type ClientDetails } from "@/services/clientsService";
import { getServices } from "@/services/servicesService";
import { Servico } from "@/interfaces/Servico";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ListaLancamentos = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [lancamentos, setLancamentos] = useState<BillingEntry[]>([]);
    const [clientes, setClientes] = useState<ClientDetails[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [filterClientId, setFilterClientId] = useState<string>("all");
    const [filterDateStart, setFilterDateStart] = useState<string>("");
    const [filterDateEnd, setFilterDateEnd] = useState<string>("");
    const [filterIsBillable, setFilterIsBillable] = useState<string>("all");
    const [filterOnlyWithoutInvoice, setFilterOnlyWithoutInvoice] = useState<boolean>(false);

    const loadData = useCallback(async () => {
        try {
            const [lancamentosRes, clientesRes, servicosRes] = await Promise.all([
                getBillingEntries({
                    ClientId: filterClientId !== "all" ? filterClientId : undefined,
                    ServiceDateStart: filterDateStart || undefined,
                    ServiceDateEnd: filterDateEnd || undefined,
                    IsBillable: filterIsBillable === "all" ? undefined : filterIsBillable === "yes",
                    OnlyWithoutInvoice: filterOnlyWithoutInvoice || undefined,
                }),
                getClients({ includePartner: false }),
                getServices(),
            ]);

            setLancamentos(lancamentosRes.items);
            setClientes(clientesRes.items);

            const servicosItems = Array.isArray(servicosRes)
                ? servicosRes
                : Array.isArray((servicosRes as any)?.items)
                    ? (servicosRes as any).items
                    : [];
            setServicos(servicosItems);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao carregar dados",
                description:
                    error?.data?.message ||
                    error?.message ||
                    "Não foi possível carregar os dados.",
                variant: "destructive",
            });
        }
    }, [toast, filterClientId, filterDateStart, filterDateEnd, filterIsBillable, filterOnlyWithoutInvoice]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getClientName = (clientId: string) => {
        const client = clientes.find((c) => c.id === clientId);
        return client?.tradeName || "Cliente não encontrado";
    };

    const getServiceName = (serviceId: string) => {
        const service = servicos.find((s) => s.id === serviceId);
        return service?.name || "Serviço não encontrado";
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("pt-BR");
    };

    const filteredLancamentos = lancamentos.filter((lancamento) => {
        const term = searchTerm.toLowerCase();
        const clientName = getClientName(lancamento.clientId).toLowerCase();
        const serviceName = getServiceName(lancamento.serviceId).toLowerCase();
        return clientName.includes(term) || serviceName.includes(term);
    });

    const hasActiveFilters = searchTerm || filterClientId !== "all" || filterDateStart || filterDateEnd || filterIsBillable !== "all" || filterOnlyWithoutInvoice;

    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Lançamentos de Faturamento</CardTitle>
                        <CardDescription>Gerencie os lançamentos de serviços prestados</CardDescription>
                    </div>
                    <Button onClick={() => navigate("/home/cadastro-lancamentos")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Lançamento
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por cliente ou serviço..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterClientId} onValueChange={setFilterClientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos os clientes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os clientes</SelectItem>
                                {clientes.map((cliente) => (
                                    <SelectItem key={cliente.id} value={cliente.id}>
                                        {cliente.tradeName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterIsBillable} onValueChange={setFilterIsBillable}>
                            <SelectTrigger>
                                <SelectValue placeholder="Faturável" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="yes">Faturável</SelectItem>
                                <SelectItem value="no">Não Faturável</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            type="date"
                            placeholder="Data Início"
                            value={filterDateStart}
                            onChange={(e) => setFilterDateStart(e.target.value)}
                        />
                        <Input
                            type="date"
                            placeholder="Data Fim"
                            value={filterDateEnd}
                            onChange={(e) => setFilterDateEnd(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="withoutInvoice"
                                checked={filterOnlyWithoutInvoice}
                                onChange={(e) => setFilterOnlyWithoutInvoice(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <label htmlFor="withoutInvoice" className="text-sm">
                                Apenas sem nota fiscal
                            </label>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <div className="flex gap-2 text-sm text-muted-foreground flex-wrap">
                            <span>Filtros ativos:</span>
                            {searchTerm && (
                                <span className="bg-secondary px-2 py-1 rounded">Busca: "{searchTerm}"</span>
                            )}
                            {filterClientId !== "all" && (
                                <span className="bg-secondary px-2 py-1 rounded">
                                    Cliente: {getClientName(filterClientId)}
                                </span>
                            )}
                            {filterDateStart && (
                                <span className="bg-secondary px-2 py-1 rounded">
                                    Data Início: {formatDate(filterDateStart)}
                                </span>
                            )}
                            {filterDateEnd && (
                                <span className="bg-secondary px-2 py-1 rounded">
                                    Data Fim: {formatDate(filterDateEnd)}
                                </span>
                            )}
                            {filterIsBillable !== "all" && (
                                <span className="bg-secondary px-2 py-1 rounded">
                                    {filterIsBillable === "yes" ? "Faturável" : "Não Faturável"}
                                </span>
                            )}
                            {filterOnlyWithoutInvoice && (
                                <span className="bg-secondary px-2 py-1 rounded">Sem nota fiscal</span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterClientId("all");
                                    setFilterDateStart("");
                                    setFilterDateEnd("");
                                    setFilterIsBillable("all");
                                    setFilterOnlyWithoutInvoice(false);
                                }}
                                className="text-primary hover:underline ml-2"
                            >
                                Limpar todos
                            </button>
                        </div>
                    )}
                </div>

                {filteredLancamentos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-md">
                        {hasActiveFilters
                            ? "Nenhum lançamento encontrado com os filtros aplicados."
                            : "Nenhum lançamento cadastrado ainda."}
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Serviço</TableHead>
                                    <TableHead>Quantidade</TableHead>
                                    <TableHead>Data Serviço</TableHead>
                                    <TableHead>Faturável</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLancamentos.map((lancamento) => (
                                    <TableRow key={lancamento.id}>
                                        <TableCell className="font-medium">
                                            {getClientName(lancamento.clientId)}
                                        </TableCell>
                                        <TableCell>{getServiceName(lancamento.serviceId)}</TableCell>
                                        <TableCell>{lancamento.quantity}</TableCell>
                                        <TableCell>{formatDate(lancamento.serviceDate)}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${lancamento.isBillable
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {lancamento.isBillable ? "Sim" : "Não"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        navigate(`/home/cadastro-lancamentos/${lancamento.id}?view=readonly`)
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/home/cadastro-lancamentos/${lancamento.id}`)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ListaLancamentos;
