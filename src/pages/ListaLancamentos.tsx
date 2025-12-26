import { useState, useEffect, useCallback, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Plus, Eye, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBillingEntries, type BillingEntry } from "@/services/billingEntriesService";
import { getClients, type ClientDetails } from "@/services/clientsService";
import { getServices } from "@/services/servicesService";
import { Servico } from "@/interfaces/Servico";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Invoice } from "@/services/invoicesService";
import { getClientServicePrices, type ClientServicePrice } from "@/services/clientServicePricesService";
import { cn } from "@/lib/utils";
import { CloseInvoicesWizard, type ClientClosingGroup } from "@/components/CloseInvoicesWizard";

const ListaLancamentos = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [lancamentos, setLancamentos] = useState<BillingEntry[]>([]);
    const [clientes, setClientes] = useState<ClientDetails[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [clientServicePrices, setClientServicePrices] = useState<ClientServicePrice[]>([]);
    const [filterClientId, setFilterClientId] = useState<string>("all");
    const [filterDateStart, setFilterDateStart] = useState<string>("");
    const [filterDateEnd, setFilterDateEnd] = useState<string>("");
    const [filterIsBillable, setFilterIsBillable] = useState<string>("all");
    const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
    const [expandedClientIds, setExpandedClientIds] = useState<string[]>([]);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardGroups, setWizardGroups] = useState<ClientClosingGroup[]>([]);
    const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [lancamentosRes, clientesRes, servicosRes, clientServicePricesRes] = await Promise.all([
                getBillingEntries({
                    ClientId: filterClientId !== "all" ? filterClientId : undefined,
                    ServiceDateStart: filterDateStart || undefined,
                    ServiceDateEnd: filterDateEnd || undefined,
                    IsBillable: filterIsBillable === "all" ? undefined : filterIsBillable === "yes",
                }),
                getClients({ includePartner: false, pageSize: 1000 }),
                getServices(),
                getClientServicePrices({ OnlyActive: true }),
            ]);

            setLancamentos(lancamentosRes.items);
            setClientes(clientesRes.items);

            const servicosItems = Array.isArray(servicosRes)
                ? servicosRes
                : Array.isArray((servicosRes as any)?.items)
                    ? (servicosRes as any).items
                    : [];
            setServicos(servicosItems);
            setClientServicePrices(clientServicePricesRes.items);

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
    }, [toast, filterClientId, filterDateStart, filterDateEnd, filterIsBillable]);

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

    // Grouping Logic
    const groupedLancamentos = filteredLancamentos.reduce((acc, lancamento) => {
        if (!acc[lancamento.clientId]) {
            acc[lancamento.clientId] = [];
        }
        acc[lancamento.clientId].push(lancamento);
        return acc;
    }, {} as Record<string, typeof filteredLancamentos>);

    const sortedClientIds = Object.keys(groupedLancamentos).sort((a, b) => {
        return getClientName(a).localeCompare(getClientName(b));
    });

    // Selection Logic
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedEntryIds(filteredLancamentos.map((l) => l.id));
        } else {
            setSelectedEntryIds([]);
        }
    };

    const handleSelectEntry = (entryId: string, checked: boolean) => {
        if (checked) {
            setSelectedEntryIds([...selectedEntryIds, entryId]);
        } else {
            setSelectedEntryIds(selectedEntryIds.filter((id) => id !== entryId));
        }
    };

    const handleSelectGroup = (clientId: string, checked: boolean) => {
        const groupEntries = groupedLancamentos[clientId] || [];
        const groupEntryIds = groupEntries.map(l => l.id);

        if (checked) {
            // Add all items from this group that aren't already selected
            const newSelection = [...selectedEntryIds];
            groupEntryIds.forEach(id => {
                if (!newSelection.includes(id)) {
                    newSelection.push(id);
                }
            });
            setSelectedEntryIds(newSelection);
        } else {
            // Remove all items from this group
            setSelectedEntryIds(selectedEntryIds.filter(id => !groupEntryIds.includes(id)));
        }
    };

    const toggleExpandGroup = (clientId: string) => {
        setExpandedClientIds(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const isGroupSelected = (clientId: string) => {
        const groupEntries = groupedLancamentos[clientId] || [];
        if (groupEntries.length === 0) return false;
        return groupEntries.every(l => selectedEntryIds.includes(l.id));
    };

    const isGroupPartiallySelected = (clientId: string) => {
        const groupEntries = groupedLancamentos[clientId] || [];
        if (groupEntries.length === 0) return false;
        const selectedCount = groupEntries.filter(l => selectedEntryIds.includes(l.id)).length;
        return selectedCount > 0 && selectedCount < groupEntries.length;
    };

    const allSelected = filteredLancamentos.length > 0 &&
        selectedEntryIds.length === filteredLancamentos.length;

    const someSelected = selectedEntryIds.length > 0 && !allSelected;

    const handleSendToInvoice = async () => {
        if (selectedEntryIds.length === 0) {
            toast({
                title: "Nenhum lançamento selecionado",
                description: "Selecione ao menos um lançamento para fechar fatura.",
                variant: "destructive",
            });
            return;
        }

        // Get selected entries
        const selectedEntries = lancamentos.filter((l) => selectedEntryIds.includes(l.id));

        // Validate: all entries must be billable
        const nonBillableEntries = selectedEntries.filter((e) => !e.isBillable);
        if (nonBillableEntries.length > 0) {
            toast({
                title: "Lançamentos não faturáveis",
                description: `${nonBillableEntries.length} lançamento(s) selecionado(s) não são faturáveis. Apenas lançamentos faturáveis podem ser enviados para fatura.`,
                variant: "destructive",
            });
            return;
        }

        // Validate: all entries must not already have an invoice
        const alreadyInvoiced = selectedEntries.filter((e) => e.invoiceId);
        if (alreadyInvoiced.length > 0) {
            toast({
                title: "Lançamentos já faturados",
                description: `${alreadyInvoiced.length} lançamento(s) já possui(em) fatura associada.`,
                variant: "destructive",
            });
            return;
        }

        setIsGeneratingInvoices(true);
        const newWizardGroups: ClientClosingGroup[] = [];
        const errors: string[] = [];

        // Group by client
        const groupedByClient = selectedEntries.reduce((acc, entry) => {
            if (!acc[entry.clientId]) {
                acc[entry.clientId] = [];
            }
            acc[entry.clientId].push(entry);
            return acc;
        }, {} as Record<string, typeof selectedEntries>);

        // Process each client group
        try {
            for (const [clientId, clientEntries] of Object.entries(groupedByClient)) {
                const clientDetails = clientes.find((c) => c.id === clientId);
                if (!clientDetails) {
                    errors.push(`Cliente ID ${clientId} não encontrado.`);
                    continue;
                }

                let totalAmount = 0;
                clientEntries.forEach(entry => {
                    const price = clientServicePrices.find(
                        sp => sp.clientId === entry.clientId && sp.serviceId === entry.serviceId
                    )?.unitPrice ?? 0;
                    totalAmount += (entry.quantity * price);
                });

                newWizardGroups.push({
                    client: clientDetails,
                    entries: clientEntries,
                    totalAmount: totalAmount
                });
            }

            if (errors.length > 0) {
                toast({
                    title: "Erros durante a geração",
                    description: (
                        <div className="mt-2 text-xs">
                            <p>Algumas faturas falharam:</p>
                            <ul className="list-disc pl-4 mt-1">
                                {errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    ),
                    variant: "destructive",
                });
            }

            if (newWizardGroups.length > 0) {
                setWizardGroups(newWizardGroups);
                setIsWizardOpen(true);
            }

        } catch (error) {
            console.error(error);
            toast({
                title: "Erro critico",
                description: "Ocorreu um erro ao preparar o fechamento.",
                variant: "destructive"
            });
        } finally {
            setIsGeneratingInvoices(false);
        }
    };

    const handleWizardSuccess = () => {
        setIsWizardOpen(false);
        setWizardGroups([]);
        setSelectedEntryIds([]);
        loadData();
    };

    const hasActiveFilters = searchTerm || filterClientId !== "all" || filterDateStart || filterDateEnd || filterIsBillable !== "all";

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
                {/* Filters Section */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterClientId("all");
                                    setFilterDateStart("");
                                    setFilterDateEnd("");
                                    setFilterIsBillable("all");
                                }}
                                className="text-primary hover:underline ml-2"
                            >
                                Limpar todos
                            </button>
                        </div>
                    )}
                </div>

                {/* Selection Action Bar */}
                <div className="mb-4 p-4 bg-primary/10 rounded-md flex justify-between items-center transition-all h-16 data-[visible=false]:opacity-0 data-[visible=false]:h-0 data-[visible=false]:p-0 overflow-hidden" data-visible={selectedEntryIds.length > 0}>
                    <span className="text-sm font-medium">
                        {selectedEntryIds.length} lançamento(s) selecionado(s)
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEntryIds([])}
                        >
                            Limpar Seleção
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSendToInvoice}
                            disabled={isGeneratingInvoices}
                        >
                            {isGeneratingInvoices ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Preparando...
                                </>
                            ) : (
                                "Fechar Faturas"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Content: Grouped by Client */}
                {filteredLancamentos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-md">
                        {hasActiveFilters
                            ? "Nenhum lançamento encontrado com os filtros aplicados."
                            : "Nenhum lançamento cadastrado ainda."}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Global Header just for "Select All" indication */}
                        <div className="flex items-center gap-2 p-2 border-b">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={handleSelectAll}
                                aria-label="Selecionar todos os lançamentos"
                                className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                            />
                            <span className="text-sm font-medium text-muted-foreground">Selecionar Todos ({filteredLancamentos.length})</span>
                        </div>

                        {sortedClientIds.map((clientId) => {
                            const isExpanded = expandedClientIds.includes(clientId);
                            const groupEntries = groupedLancamentos[clientId];
                            const groupSelected = isGroupSelected(clientId);
                            const groupPartiallySelected = isGroupPartiallySelected(clientId);

                            return (
                                <div key={clientId} className="border rounded-md overflow-hidden">
                                    {/* Group Header */}
                                    <div
                                        className={cn(
                                            "flex items-center justify-between p-3 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors",
                                            isExpanded && "bg-muted/60 border-b"
                                        )}
                                        onClick={() => toggleExpandGroup(clientId)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={groupSelected}
                                                    onCheckedChange={(checked) => handleSelectGroup(clientId, checked as boolean)}
                                                    className={groupPartiallySelected ? "data-[state=checked]:bg-primary/50" : ""}
                                                />
                                            </div>
                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                            <span className="font-medium">{getClientName(clientId)}</span>
                                            <span className="text-sm text-muted-foreground ml-2">({groupEntries.length} lançamentos)</span>
                                        </div>
                                    </div>

                                    {/* Group Body */}
                                    {isExpanded && (
                                        <div className="bg-background">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12"></TableHead>
                                                        <TableHead>Serviço</TableHead>
                                                        <TableHead>Quantidade</TableHead>
                                                        <TableHead>Data Serviço</TableHead>
                                                        <TableHead>Faturável</TableHead>
                                                        <TableHead className="text-right">Ações</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {groupEntries.map((lancamento) => (
                                                        <TableRow
                                                            key={lancamento.id}
                                                            className={selectedEntryIds.includes(lancamento.id) ? "bg-muted/50" : ""}
                                                        >
                                                            <TableCell>
                                                                <Checkbox
                                                                    checked={selectedEntryIds.includes(lancamento.id)}
                                                                    onCheckedChange={(checked) =>
                                                                        handleSelectEntry(lancamento.id, checked as boolean)
                                                                    }
                                                                />
                                                            </TableCell>
                                                            <TableCell>{getServiceName(lancamento.serviceId)}</TableCell>
                                                            <TableCell>{lancamento.quantity}</TableCell>
                                                            <TableCell>{formatDate(lancamento.serviceDate)}</TableCell>
                                                            <TableCell>
                                                                <span
                                                                    className={cn(
                                                                        "px-2 py-1 rounded text-xs",
                                                                        lancamento.isBillable
                                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                                                    )}
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
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            <CloseInvoicesWizard
                open={isWizardOpen}
                onOpenChange={setIsWizardOpen}
                groups={wizardGroups}
                onSuccess={handleWizardSuccess}
            />
        </Card>
    );
};

export default ListaLancamentos;
