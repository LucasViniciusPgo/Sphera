import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { closeInvoices, calculateInstallments } from "@/services/invoicesService";
import { Invoice, MissingPriceBehavior, CloseInvoicesFormData } from "@/interfaces/Invoice";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const closeInvoicesSchema = z.object({
    missingPriceBehavior: z.string().min(1).transform(Number),
    closeOption: z.enum(["without_installments", "with_installments"]),
    installmentCount: z.number().min(2, "Mínimo 2 parcelas").max(12, "Máximo 12 parcelas").optional(),
    firstDueDate: z.string().optional(),
    overrideDueDate: z.string().optional(),
});

type CloseInvoicesFormValues = z.infer<typeof closeInvoicesSchema>;

interface CloseInvoicesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedInvoices: Invoice[];
    onSuccess: () => void;
}

export function CloseInvoicesModal({
    open,
    onOpenChange,
    selectedInvoices,
    onSuccess,
}: CloseInvoicesModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [installmentPreview, setInstallmentPreview] = useState<any[]>([]);

    const form = useForm<CloseInvoicesFormValues>({
        resolver: zodResolver(closeInvoicesSchema),
        defaultValues: {
            missingPriceBehavior: MissingPriceBehavior.Block,
            closeOption: "without_installments",
            installmentCount: 2,
            firstDueDate: "",
            overrideDueDate: "",
        },
    });

    const closeOption = form.watch("closeOption");
    const installmentCount = form.watch("installmentCount");
    const firstDueDate = form.watch("firstDueDate");

    // Validate that all selected invoices are from the same client and period
    const validateSelection = () => {
        if (selectedInvoices.length === 0) {
            return { valid: false, error: "Nenhuma fatura selecionada" };
        }

        const firstInvoice = selectedInvoices[0];
        const allSameClient = selectedInvoices.every((inv) => inv.clientId === firstInvoice.clientId);
        const allSamePeriod = selectedInvoices.every(
            (inv) =>
                inv.issueDate === firstInvoice.issueDate
        );

        if (!allSameClient) {
            return { valid: false, error: "Todas as faturas devem ser do mesmo cliente" };
        }

        if (!allSamePeriod) {
            return { valid: false, error: "Todas as faturas devem ser do mesmo período" };
        }

        return { valid: true, clientId: firstInvoice.clientId, issueDate: firstInvoice.issueDate};
    };

    // Calculate total amount
    const totalAmount = selectedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Update installment preview when relevant fields change
    useEffect(() => {
        if (closeOption === "with_installments" && installmentCount && firstDueDate && totalAmount > 0) {
            try {
                const installments = calculateInstallments(totalAmount, installmentCount, firstDueDate);
                setInstallmentPreview(installments);
            } catch (error) {
                setInstallmentPreview([]);
            }
        } else {
            setInstallmentPreview([]);
        }
    }, [closeOption, installmentCount, firstDueDate, totalAmount]);

    const onSubmit = async (data: CloseInvoicesFormValues) => {
        const validation = validateSelection();
        if (!validation.valid) {
            toast({
                title: "Erro de validação",
                description: validation.error,
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData: CloseInvoicesFormData = {
                selectedInvoiceIds: selectedInvoices.map((inv) => inv.id),
                clientId: validation.clientId!,
                issueDate: validation.issueDate!,
                missingPriceBehavior: data.missingPriceBehavior,
                closeWithInstallments: data.closeOption === "with_installments",
                overrideDueDate: data.overrideDueDate || undefined,
            };

            if (data.closeOption === "with_installments" && installmentPreview.length > 0) {
                formData.customInstallments = installmentPreview;
            }

            await closeInvoices(formData);

            toast({
                title: "Faturas fechadas",
                description: `${selectedInvoices.length} fatura(s) fechada(s) com sucesso.`,
            });

            onSuccess();
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Erro ao fechar faturas",
                description:
                    err?.data?.message ||
                    err?.message ||
                    "Não foi possível fechar as faturas. Verifique os dados e tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("pt-BR");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Fechar Faturas</DialogTitle>
                    <DialogDescription>
                        Configure as opções para fechar {selectedInvoices.length} fatura(s) selecionada(s).
                        Valor total: {formatCurrency(totalAmount)}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="missingPriceBehavior"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comportamento para Preços Ausentes</FormLabel>
                                    <FormControl>
                                        <Select value={field.value.toString()} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o comportamento" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={MissingPriceBehavior.Block.toString()}>
                                                    Bloquear - Interromper se houver preço ausente
                                                </SelectItem>
                                                <SelectItem value={MissingPriceBehavior.AllowManual.toString()}>
                                                    Permitir Manual - Permitir ajuste manual do preço
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="closeOption"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Opção de Fechamento</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="space-y-3"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="without_installments" id="without" />
                                                <Label htmlFor="without" className="font-normal cursor-pointer">
                                                    Fechar sem parcelamento
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="with_installments" id="with" />
                                                <Label htmlFor="with" className="font-normal cursor-pointer">
                                                    Fechar com parcelamento
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {closeOption === "with_installments" && (
                            <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                                <h4 className="font-semibold text-sm">Configuração de Parcelamento</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="installmentCount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número de Parcelas</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={2}
                                                        max={12}
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="firstDueDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primeiro Vencimento</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {installmentPreview.length > 0 && (
                                    <div className="mt-4">
                                        <h5 className="text-sm font-medium mb-2">Prévia das Parcelas</h5>
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Parcela</TableHead>
                                                        <TableHead>Vencimento</TableHead>
                                                        <TableHead className="text-right">Valor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {installmentPreview.map((inst) => (
                                                        <TableRow key={inst.installmentNumber}>
                                                            <TableCell>{inst.installmentNumber}</TableCell>
                                                            <TableCell>{formatDate(inst.dueDate)}</TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(inst.amount)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="overrideDueDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vencimento Customizado (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Fechando..." : "Confirmar e Fechar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
