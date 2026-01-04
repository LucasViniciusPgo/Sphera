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

const RelatorioClientes = () => {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    // Filters
    const [partnerId, setPartnerId] = useState("");
    const [filtroStatus, setFiltroStatus] = useState<string>("todos");
    const [dueDateFrom, setDueDateFrom] = useState<string>("");
    const [dueDateTo, setDueDateTo] = useState<string>("");

    const handleClearFilters = () => {
        setPartnerId("");
        setFiltroStatus("todos");
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
            let expirationStatus: number | undefined = undefined;
            if (filtroStatus === "vencido") expirationStatus = EExpirationStatus.Expired;
            else if (filtroStatus === "a-vencer") expirationStatus = EExpirationStatus.AboutToExpire;
            else if (filtroStatus === "dentro-prazo") expirationStatus = EExpirationStatus.WithinDeadline;

            // Fetch all matching clients (large pageSize to avoid missing records)
            const { items } = await getClients({
                partnerId: partnerId || undefined,
                expirationStatus: expirationStatus,
                dueDateFrom: dueDateFrom || undefined,
                dueDateTo: dueDateTo || undefined,
                pageSize: 5000,
                includePartner: true
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
            if (filtroStatus !== "todos") activeFilters.push(`Contrato: ${filtroStatus}`);
            if (dueDateFrom || dueDateTo) activeFilters.push(`Venc. e-CAC: ${dueDateFrom || ""} até ${dueDateTo || ""}`);

            if (activeFilters.length > 0) {
                doc.text(`Filtros: ${activeFilters.join(" | ")}`, 14, filterY);
                filterY += 10;
            } else {
                filterY += 5;
            }

            // Table
            autoTable(doc, {
                startY: filterY,
                head: [["Nome Fantasia", "Razão Social", "CNPJ", "Parceiro", "Venc. e-CAC", "Status"]],
                body: items.map(c => [
                    c.tradeName,
                    c.legalName,
                    formatCNPJ(c.cnpj),
                    c.partner?.legalName || "-",
                    c.ecacExpirationDate ? new Date(c.ecacExpirationDate).toLocaleDateString("pt-BR") : "-",
                    getStatusLabel(c.expirationStatus)
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [163, 41, 49] },
                alternateRowStyles: { fillColor: [245, 245, 245] },
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Parceiro */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Parceiro</label>
                        <AsyncSelect
                            fetcher={async (search) => {
                                const res = await getPartners({ search, pageSize: 20 });
                                return res.items;
                            }}
                            value={partnerId}
                            onChange={setPartnerId}
                            getLabel={(p: any) => p.legalName}
                            getValue={(p: any) => p.id}
                            placeholder="Todos os parceiros"
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
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
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Vencimento e-CAC (De)</label>
                        <Input
                            type="date"
                            value={dueDateFrom}
                            onChange={(e) => setDueDateFrom(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Vencimento e-CAC (Até)</label>
                        <Input
                            type="date"
                            value={dueDateTo}
                            onChange={(e) => setDueDateTo(e.target.value)}
                        />
                    </div>
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
