import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileStack, Loader2, Eraser, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDocuments } from "@/services/documentsService.ts";
import { getPartners } from "@/services/partnersService.ts";
import { getClients } from "@/services/clientsService.ts";
import { getServices } from "@/services/servicesService.ts";
import { AsyncSelect } from "@/components/AsyncSelect";
import { EExpirationStatus, StatusType } from "@/interfaces/Arquivo";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const RelatorioArquivos = () => {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    // Filters
    const [partnerId, setPartnerId] = useState("");
    const [clientId, setClientId] = useState("");
    const [serviceId, setServiceId] = useState("");
    const [filtroStatus, setFiltroStatus] = useState<string>("todos");
    const [dueDateFrom, setDueDateFrom] = useState<string>("");
    const [dueDateTo, setDueDateTo] = useState<string>("");

    const [servicos, setServicos] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const { items } = await getServices();
                setServicos(items);
            } catch (error) {
                console.error("Erro ao carregar serviços:", error);
            }
        })();
    }, []);

    const handleClearFilters = () => {
        setPartnerId("");
        setClientId("");
        setServiceId("");
        setFiltroStatus("todos");
        setDueDateFrom("");
        setDueDateTo("");
    };

    const getStatusLabel = (status: EExpirationStatus | string) => {
        switch (status) {
            case EExpirationStatus.Expired:
            case "vencido": return "Vencido";
            case EExpirationStatus.AboutToExpire:
            case "a-vencer": return "A Vencer";
            case EExpirationStatus.WithinDeadline:
            case "dentro-prazo": return "Dentro do Prazo";
            default: return "Desconhecido";
        }
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            let status: StatusType | undefined = undefined;
            if (filtroStatus === "vencido") status = "vencido";
            else if (filtroStatus === "a-vencer") status = "a-vencer";
            else if (filtroStatus === "dentro-prazo") status = "dentro-prazo";

            // Fetch all matching documents
            const items = await getDocuments({
                partnerId: partnerId || undefined,
                clientId: clientId || undefined,
                serviceId: serviceId || undefined,
                status: status,
                dueDateFrom: dueDateFrom || undefined,
                dueDateTo: dueDateTo || undefined,
                pageSize: 5000,
            });

            if (items.length === 0) {
                toast({
                    title: "Relatório Vazio",
                    description: "Nenhum arquivo encontrado com os filtros selecionados.",
                    variant: "destructive"
                });
                return;
            }

            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
            const timestamp = new Date().toLocaleString("pt-BR");

            // Header
            doc.setFontSize(18);
            doc.text("Relatório de Arquivos", 14, 20);
            doc.setFontSize(10);
            doc.text(`Gerado em: ${timestamp}`, 14, 28);
            doc.text(`Total de Arquivos: ${items.length}`, 14, 34);

            // Filter Summary in PDF
            let filterY = 42;
            doc.setFontSize(9);
            doc.setTextColor(100);
            const activeFilters = [];
            if (partnerId) activeFilters.push("Parceiro Selecionado");
            if (clientId) activeFilters.push("Cliente Selecionado");
            if (serviceId) activeFilters.push("Serviço Selecionado");
            if (filtroStatus !== "todos") activeFilters.push(`Status: ${getStatusLabel(filtroStatus)}`);
            if (dueDateFrom || dueDateTo) activeFilters.push(`Vencimento: ${dueDateFrom || "?"} até ${dueDateTo || "?"}`);

            if (activeFilters.length > 0) {
                doc.text(`Filtros: ${activeFilters.join(" | ")}`, 14, filterY);
                filterY += 10;
            } else {
                filterY += 5;
            }

            // Table
            autoTable(doc, {
                startY: filterY,
                head: [["Arquivo", "Parceiro", "Cliente", "Serviço", "Responsável", "Vencimento", "Status"]],
                body: items.map(a => [
                    a.fileName,
                    a.partnerName || "-",
                    a.clientName || "-",
                    a.serviceName || "-",
                    a.responsibleName || "-",
                    a.dueDate ? new Date(a.dueDate).toLocaleDateString("pt-BR") : "-",
                    getStatusLabel(a.status)
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

            doc.save(`relatorio_arquivos_${new Date().getTime()}.pdf`);

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
                        <FileStack className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Relatório de Arquivos</CardTitle>
                        <CardDescription>
                            Configure os filtros abaixo para gerar um relatório em PDF com a listagem dos arquivos.
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
                            onChange={(val) => {
                                setPartnerId(val);
                                setClientId(""); // Reset client when partner changes
                            }}
                            getLabel={(p: any) => p.legalName}
                            getValue={(p: any) => p.id}
                            placeholder="Todos os parceiros"
                        />
                    </div>

                    {/* Cliente */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cliente</label>
                        <AsyncSelect
                            fetcher={async (search) => {
                                const res = await getClients({
                                    search,
                                    partnerId: partnerId || undefined,
                                    pageSize: 20
                                });
                                return res.items;
                            }}
                            value={clientId}
                            onChange={setClientId}
                            getLabel={(c: any) => c.tradeName || c.legalName}
                            getValue={(c: any) => c.id}
                            placeholder="Todos os clientes"
                            key={partnerId} // Force remount to clear options when partner changes
                        />
                    </div>

                    {/* Serviço */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Serviço</label>
                        <Select value={serviceId} onValueChange={setServiceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos os serviços" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os Serviços</SelectItem>
                                {servicos.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status Vencimento</label>
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
                        <label className="text-sm font-medium">Vencimento (De)</label>
                        <Input
                            type="date"
                            value={dueDateFrom}
                            onChange={(e) => setDueDateFrom(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Vencimento (Até)</label>
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

export default RelatorioArquivos;
