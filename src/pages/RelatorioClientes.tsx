import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Eraser } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getClients, type ClientDetails } from "@/services/clientsService.ts";
import { getPartners } from "@/services/partnersService.ts";
import { AsyncSelect } from "@/components/AsyncSelect";
import { EExpirationStatus } from "@/interfaces/Arquivo";
import { formatCNPJ } from "@/utils/format.ts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getClientsReport } from "@/services/reportsService.ts";
import { EPaymentStatus } from "@/interfaces/Pagamento";
import { Check } from "lucide-react";
import { useAuthRole } from "@/hooks/useAuthRole";

const RelatorioClientes = () => {
    const { toast } = useToast();
    const { isAdmin, isFinanceiro } = useAuthRole();
    const [isGenerating, setIsGenerating] = useState(false);

    // Filters
    const [partnerId, setPartnerId] = useState("");
    const [partnerName, setPartnerName] = useState("");
    const [filtroStatus, setFiltroStatus] = useState<string>("todos");
    const [filtroPagamento, setFiltroPagamento] = useState<number | undefined>(undefined);
    const [dueDateFrom, setDueDateFrom] = useState<string>("");
    const [dueDateTo, setDueDateTo] = useState<string>("");

    const handleClearFilters = () => {
        setPartnerId("");
        setPartnerName("");
        setFiltroStatus("todos");
        setFiltroPagamento(undefined);
        setDueDateFrom("");
        setDueDateTo("");
    };

    const getStatusLabel = (status: EExpirationStatus) => {
        switch (status) {
            case EExpirationStatus.Expired: return "Vencido";
            case EExpirationStatus.AboutToExpire: return "A Vencer";
            case EExpirationStatus.WithinDeadline: return "Dentro do Prazo";
            default: return "Desconhecido";
        }
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            // Use the specialized report service
            const items = await getClientsReport({
                partnerId: partnerId || undefined,
                status: filtroStatus,
                paymentStatus: filtroPagamento?.toString(),
                fromDate: dueDateFrom || undefined,
                toDate: dueDateTo || undefined
            });

            if (items.length === 0) {
                toast({
                    title: "Relatório Vazio",
                    description: "Nenhum cliente encontrado com os filtros selecionados.",
                    variant: "destructive"
                });
                return;
            }

            const doc = new jsPDF();
            const timestamp = new Date().toLocaleString("pt-BR");

            // Header
            doc.setFontSize(18);
            doc.text("Relatório de Clientes", 14, 20);
            doc.setFontSize(10);
            doc.text(`Gerado em: ${timestamp}`, 14, 28);
            doc.text(`Total de Clientes: ${items.length}`, 14, 34);

            // Filter Summary in PDF
            let filterY = 42;
            doc.setFontSize(9);
            doc.setTextColor(100);
            const activeFilters = [];
            if (partnerId && partnerName) activeFilters.push(`Parceiro: ${partnerName}`);

            if (filtroStatus !== "todos") {
                let statusLabel = "";
                if (filtroStatus === "vencido") statusLabel = "Vencido";
                else if (filtroStatus === "a-vencer") statusLabel = "A Vencer";
                else if (filtroStatus === "dentro-prazo") statusLabel = "Dentro do Prazo";
                activeFilters.push(`Contrato: ${statusLabel}`);
            }

            if (dueDateFrom || dueDateTo) {
                let dateLabel = "Venc. e-CAC: ";
                if (dueDateFrom && dueDateTo) {
                    dateLabel += `${new Date(`${dueDateFrom}T00:00:00`).toLocaleDateString("pt-BR")} até ${new Date(`${dueDateTo}T00:00:00`).toLocaleDateString("pt-BR")}`;
                } else if (dueDateFrom) {
                    dateLabel += new Date(`${dueDateFrom}T00:00:00`).toLocaleDateString("pt-BR");
                } else {
                    dateLabel += new Date(`${dueDateTo}T00:00:00`).toLocaleDateString("pt-BR");
                }
                activeFilters.push(dateLabel);
            }

            if (activeFilters.length > 0) {
                doc.text(`Filtros: ${activeFilters.join(" | ")}`, 14, filterY);
                filterY += 10;
            } else {
                filterY += 5;
            }

            // Table
            autoTable(doc, {
                startY: filterY,
                head: [[
                    "Nome Fantasia",
                    "Razão Social",
                    "CNPJ",
                    "Parceiro",
                    "Venc. e-CAC",
                    "Contrato",
                    ...(isAdmin || isFinanceiro ? [""] : [])
                ]],
                body: items.map(c => [
                    c.tradeName,
                    c.legalName,
                    formatCNPJ(c.cnpj),
                    c.partnerName || "-",
                    c.ecacExpirationDate ? new Date(c.ecacExpirationDate.includes("T") ? c.ecacExpirationDate : `${c.ecacExpirationDate}T00:00:00`).toLocaleDateString("pt-BR") : "-",
                    c.status !== null ? getStatusLabel(c.status) : "-",
                    ...(isAdmin || isFinanceiro ? [{ content: "", data: { paymentStatus: c.paymentStatus } }] : [])
                ]),
                didDrawCell: (data) => {
                    if (data.section === "body" && data.column.index === 6) {
                        const cellData = (data.cell.raw as any)?.data;
                        if (cellData && (cellData.paymentStatus === EPaymentStatus.UpToDate || cellData.paymentStatus === EPaymentStatus.Overdue)) {
                            const x = data.cell.x + data.cell.width / 2;
                            const y = data.cell.y + data.cell.height / 2;

                            // Set color based on status
                            if (cellData.paymentStatus === EPaymentStatus.UpToDate) {
                                doc.setDrawColor(34, 197, 94); // green-500
                            } else {
                                doc.setDrawColor(239, 68, 68); // red-500
                            }

                            // Draw a simple checkmark
                            doc.setLineWidth(0.5);
                            doc.line(x - 2, y, x - 0.5, y + 1.5);
                            doc.line(x - 0.5, y + 1.5, x + 2, y - 2);
                            doc.stroke();
                        }
                    }
                },
                styles: { fontSize: 8 },
                headStyles: { fillColor: [163, 41, 49] },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                columnStyles: {
                    6: { cellWidth: 10, halign: "center" }
                }
            });

            // Footer (Page numbers)
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
            }

            doc.save(`relatorio_clientes_${new Date().getTime()}.pdf`);

            toast({
                title: "Sucesso",
                description: "O relatório foi gerado e o download deve iniciar em breve.",
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao gerar relatório",
                description: error?.message || "Ocorreu um erro inesperado.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto border-border">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Relatório de Clientes</CardTitle>
                        <CardDescription>
                            Configure os filtros abaixo para gerar um relatório em PDF com a listagem detalhada.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Parceiro */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Parceiro</label>
                        <AsyncSelect
                            fetcher={async (search) => {
                                const res = await getPartners({ search, pageSize: 20 });
                                return res.items;
                            }}
                            value={partnerId}
                            onChange={(val) => {
                                setPartnerId(val);
                                // The AsyncSelect doesn't easily give the item back on change here, 
                                // but we can add a way or just use an effect if needed. 
                                // However, we can try to find it in the list if we had it.
                                // Let's just update the label if we can.
                            }}
                            // To properly get the name, we might need a more complex state or 
                            // modify how AsyncSelect works. Let's try to pass the object if possible.
                            onSelectObject={(p: any) => setPartnerName(p.legalName)}
                            getLabel={(p: any) => p.legalName}
                            getValue={(p: any) => p.id}
                            placeholder="Todos os parceiros"
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-medium">Status Contrato</label>
                        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os Status</SelectItem>
                                <SelectItem value="vencido">Vencido</SelectItem>
                                <SelectItem value="a-vencer">A Vencer</SelectItem>
                                <SelectItem value="dentro-prazo">Dentro do Prazo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Datas */}
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-medium">Vencimento e-CAC (De)</label>
                        <Input
                            type="date"
                            value={dueDateFrom}
                            onChange={(e) => setDueDateFrom(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-medium">Vencimento e-CAC (Até)</label>
                        <Input
                            type="date"
                            value={dueDateTo}
                            onChange={(e) => setDueDateTo(e.target.value)}
                        />
                    </div>

                    {/* Status Financeiro (Discreto) */}
                    {(isAdmin || isFinanceiro) && (
                        <div className="space-y-2 md:col-span-1">
                            <label className="text-sm font-medium h-5 block"></label> {/* Spacer to align with date labels */}
                            <div className="flex items-center justify-center gap-2 border rounded-md px-3 bg-background h-10 w-fit min-w-[100px]">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFiltroPagamento(prev => prev === EPaymentStatus.UpToDate ? undefined : EPaymentStatus.UpToDate)}
                                        title="Filtrar por Em Dia"
                                        className={`w-5 h-5 border transition-all flex items-center justify-center rounded-sm ${filtroPagamento === EPaymentStatus.UpToDate
                                            ? "bg-green-500 border-green-600 text-white shadow-md scale-110"
                                            : "bg-transparent border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-green-500/10"
                                            }`}
                                    >
                                        {filtroPagamento === EPaymentStatus.UpToDate && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => setFiltroPagamento(prev => prev === EPaymentStatus.Overdue ? undefined : EPaymentStatus.Overdue)}
                                        title="Filtrar por Atrasado"
                                        className={`w-5 h-5 border transition-all flex items-center justify-center rounded-sm ${filtroPagamento === EPaymentStatus.Overdue
                                            ? "bg-red-500 border-red-600 text-white shadow-md scale-110"
                                            : "bg-transparent border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-red-500/10"
                                            }`}
                                    >
                                        {filtroPagamento === EPaymentStatus.Overdue && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                    <Button
                        className="flex-1 h-12 text-lg font-semibold"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Gerando PDF...
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2 h-5 w-5" />
                                Gerar Relatório PDF
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        className="h-12 px-6"
                        onClick={handleClearFilters}
                        disabled={isGenerating}
                    >
                        <Eraser className="mr-2 h-4 w-4" />
                        Limpar Filtros
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                    Ao clicar em gerar, o sistema buscará todos os registros correspondentes e preparará o arquivo para download.
                </p>
            </CardContent>
        </Card>
    );
};

export default RelatorioClientes;
