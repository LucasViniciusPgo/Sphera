import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getInvoices, type Invoice } from "@/services/invoicesService";
import { getClients, type ClientDetails } from "@/services/clientsService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { InvoiceStatus } from "@/interfaces/Invoice";
import { CloseInvoicesModal } from "@/components/CloseInvoicesModal";

const ListaFaturas = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [faturas, setFaturas] = useState<Invoice[]>([]);
    const [clientes, setClientes] = useState<ClientDetails[]>([]);
    const [filterClientId, setFilterClientId] = useState<string>("all");
    const [filterPeriodStart, setFilterPeriodStart] = useState<string>("");
    const [filterPeriodEnd, setFilterPeriodEnd] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [faturasRes, clientesRes] = await Promise.all([
                getInvoices({
                    ClientId: filterClientId !== "all" ? filterClientId : undefined,
                    PeriodStart: filterPeriodStart || undefined,
                    PeriodEnd: filterPeriodEnd || undefined,
                    Status: filterStatus !== "all" ? filterStatus : undefined,
                }),
                getClients({ includePartner: false }),
            ]);

            setFaturas(faturasRes.items);
            setClientes(clientesRes.items);
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
    }, [toast, filterClientId, filterPeriodStart, filterPeriodEnd, filterStatus]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getClientName = (clientId: string) => {
        const client = clientes.find((c) => c.id === clientId);
        return client?.tradeName || "Cliente não encontrado";
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("pt-BR");
    };

    const formatPeriod = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" })} - ${endDate.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" })}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case InvoiceStatus.Closed:
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case InvoiceStatus.Open:
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case InvoiceStatus.Draft:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
            case InvoiceStatus.Overdue:
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            case InvoiceStatus.Cancelled:
                return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
        }
    };

    const filteredFaturas = faturas.filter((fatura) => {
        const term = searchTerm.toLowerCase();
        const clientName = getClientName(fatura.clientId).toLowerCase();
        return clientName.includes(term);
    });

    // Only allow selection of non-closed invoices
    const selectableFaturas = filteredFaturas.filter(
        (f) => f.status !== InvoiceStatus.Closed && f.status !== InvoiceStatus.Cancelled
    );

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedInvoiceIds(selectableFaturas.map((f) => f.id));
        } else {
            setSelectedInvoiceIds([]);
        }
    };

    const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
        if (checked) {
            setSelectedInvoiceIds([...selectedInvoiceIds, invoiceId]);
        } else {
            setSelectedInvoiceIds(selectedInvoiceIds.filter((id) => id !== invoiceId));
        }
    };

    const isInvoiceSelectable = (invoice: Invoice) => {
        return invoice.status !== InvoiceStatus.Closed && invoice.status !== InvoiceStatus.Cancelled;
    };

    const allSelectableSelected = selectableFaturas.length > 0 &&
        selectedInvoiceIds.length === selectableFaturas.length;

    const someSelected = selectedInvoiceIds.length > 0 && !allSelectableSelected;

    const hasActiveFilters = searchTerm || filterClientId !== "all" || filterPeriodStart || filterPeriodEnd || filterStatus !== "all";

    const handleCloseSuccess = () => {
        setIsCloseModalOpen(false);
        setSelectedInvoiceIds([]);
        loadData();
    };

    return (
        <>
            <Card className="max-w-7xl mx-auto">
                <CardHeader>
                    <div>
                        <CardTitle>Faturas</CardTitle>
                        <CardDescription>Gerencie as faturas de faturamento</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por cliente..."
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
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os status</SelectItem>
                                    <SelectItem value={InvoiceStatus.Draft}>Rascunho</SelectItem>
                                    <SelectItem value={InvoiceStatus.Open}>Aberta</SelectItem>
                                    <SelectItem value={InvoiceStatus.Closed}>Fechada</SelectItem>
                                    <SelectItem value={InvoiceStatus.Overdue}>Vencida</SelectItem>
                                    <SelectItem value={InvoiceStatus.Cancelled}>Cancelada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                type="date"
                                placeholder="Período Início"
                                value={filterPeriodStart}
                                onChange={(e) => setFilterPeriodStart(e.target.value)}
                            />
                            <Input
                                type="date"
                                placeholder="Período Fim"
                                value={filterPeriodEnd}
                                onChange={(e) => setFilterPeriodEnd(e.target.value)}
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
                                {filterPeriodStart && (
                                    <span className="bg-secondary px-2 py-1 rounded">
                                        Início: {formatDate(filterPeriodStart)}
                                    </span>
                                )}
                                {filterPeriodEnd && (
                                    <span className="bg-secondary px-2 py-1 rounded">
                                        Fim: {formatDate(filterPeriodEnd)}
                                    </span>
                                )}
                                {filterStatus !== "all" && (
                                    <span className="bg-secondary px-2 py-1 rounded">
                                        Status: {filterStatus}
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setFilterClientId("all");
                                        setFilterPeriodStart("");
                                        setFilterPeriodEnd("");
                                        setFilterStatus("all");
                                    }}
                                    className="text-primary hover:underline ml-2"
                                >
                                    Limpar todos
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedInvoiceIds.length > 0 && (
                        <div className="mb-4 p-4 bg-primary/10 rounded-md flex justify-between items-center">
                            <span className="text-sm font-medium">
                                {selectedInvoiceIds.length} fatura(s) selecionada(s)
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedInvoiceIds([])}
                                >
                                    Limpar Seleção
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setIsCloseModalOpen(true)}
                                >
                                    Fechar Faturas
                                </Button>
                            </div>
                        </div>
                    )}

                    {filteredFaturas.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-md">
                            {hasActiveFilters
                                ? "Nenhuma fatura encontrada com os filtros aplicados."
                                : "Nenhuma fatura cadastrada ainda."}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={allSelectableSelected}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Selecionar todas"
                                                className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                                            />
                                        </TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Emissão</TableHead>
                                        <TableHead>Valor Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredFaturas.map((fatura) => (
                                        <TableRow
                                            key={fatura.id}
                                            className={selectedInvoiceIds.includes(fatura.id) ? "bg-muted/50" : ""}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedInvoiceIds.includes(fatura.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectInvoice(fatura.id, checked as boolean)
                                                    }
                                                    disabled={!isInvoiceSelectable(fatura)}
                                                    aria-label={`Selecionar fatura ${fatura.id}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {getClientName(fatura.clientId)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(fatura.issueDate)}
                                            </TableCell>
                                            <TableCell>{formatCurrency(fatura.totalAmount)}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(fatura.status)}`}
                                                >
                                                    {fatura.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>{formatDate(fatura.dueDate)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CloseInvoicesModal
                open={isCloseModalOpen}
                onOpenChange={setIsCloseModalOpen}
                selectedInvoices={faturas.filter((f) => selectedInvoiceIds.includes(f.id))}
                onSuccess={handleCloseSuccess}
            />
        </>
    );
};

export default ListaFaturas;
