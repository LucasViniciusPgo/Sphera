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
import { ClientDetails } from "@/services/clientsService";
import { BillingEntry } from "@/services/billingEntriesService";

const closeInvoicesSchema = z.object({
    missingPriceBehavior: z.string().min(1).transform(Number),
    closeOption: z.enum(["without_installments", "with_installments"]),
    installmentCount: z.number().min(2, "Mínimo 2 parcelas").max(12, "Máximo 12 parcelas").optional(),
    firstDueDate: z.string().optional(),
    overrideDueDate: z.string().optional(),
});

type CloseInvoicesFormValues = z.infer<typeof closeInvoicesSchema>;

export interface ClientClosingGroup {
    client: ClientDetails;
    entries: BillingEntry[];
    totalAmount: number;
}

interface CloseInvoicesWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groups: ClientClosingGroup[]; // The list of clients to process
    onSuccess: () => void;
}

export function CloseInvoicesWizard({
    open,
    onOpenChange,
    groups,
    onSuccess,
}: CloseInvoicesWizardProps) {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [installmentPreview, setInstallmentPreview] = useState<any[]>([]);

    const currentGroup = groups[currentIndex];
    const isLast = currentIndex === groups.length - 1;

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

    // Reset form when switching groups
    useEffect(() => {
        if (open && currentGroup) {
            form.reset({
                missingPriceBehavior: MissingPriceBehavior.Block,
                closeOption: "without_installments",
                installmentCount: 2,
                firstDueDate: "",
                overrideDueDate: "",
            });
            setInstallmentPreview([]);
        }
    }, [open, currentIndex, currentGroup, form]);

    const closeOption = form.watch("closeOption");
    const installmentCount = form.watch("installmentCount");
    const firstDueDate = form.watch("firstDueDate");

    // Calculate total amount for current group
    const totalAmount = currentGroup?.totalAmount || 0;

    // Update installment preview
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

    // Handle "Default Due Date" logic if user doesn't provide one
    const getDefaultDueDate = (client: ClientDetails) => {
        const today = new Date();
        const billingDay = client.billingDueDay || today.getDate();
        const dueDate = new Date(today.getFullYear(), today.getMonth(), billingDay);

        // If the calculated date is today or in the past, maybe move to next month? 
        // User requirements said "pegar o vencimento que está no cadastro". 
        // Usually if billing day < today, it means next month. 
        // Let's implement simple logic: if day < today, next month.
        if (billingDay < today.getDate()) {
            dueDate.setMonth(dueDate.getMonth() + 1);
        }

        return dueDate.toISOString().split('T')[0];
    };

    const onSubmit = async (data: CloseInvoicesFormValues) => {
        if (!currentGroup) return;

        setIsSubmitting(true);
        try {
            const formData: CloseInvoicesFormData = {
                // We're not using selectedInvoiceIds effectively for creating new ones here if we are closing period.
                // But the type requires string array. We can pass empty or maybe we should pass entry IDs if API supported it.
                // Since the mandate is "billing/Invoices/close closes period", we pass empty or minimal.
                selectedInvoiceIds: [],
                clientId: currentGroup.client.id,
                issueDate: new Date().toISOString().split('T')[0], // Always today as "Close Date" reference? Or maybe max date of entries?
                missingPriceBehavior: data.missingPriceBehavior,
                closeWithInstallments: data.closeOption === "with_installments",
                overrideDueDate: data.overrideDueDate || (!data.closeOption.includes("installments") ? getDefaultDueDate(currentGroup.client) : undefined),
            };

            if (data.closeOption === "with_installments" && installmentPreview.length > 0) {
                formData.customInstallments = installmentPreview;
            }

            // Call API
            await closeInvoices(formData);

            toast({
                title: "Sucesso",
                description: `Faturas de ${currentGroup.client.tradeName} fechadas com sucesso.`,
            });

            if (isLast) {
                onSuccess();
                onOpenChange(false);
            } else {
                setCurrentIndex((prev) => prev + 1);
            }

        } catch (err: any) {
            console.error(err);
            toast({
                title: "Erro ao fechar faturas",
                description:
                    err?.data?.message ||
                    err?.message ||
                    "Não foi possível fechar as faturas.",
                variant: "destructive",
            });
            // Do not advance if error
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
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("pt-BR");
    };

    if (!currentGroup) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Fechar Faturas ({currentIndex + 1}/{groups.length})
                    </DialogTitle>
                    <DialogDescription>
                        Cliente: <span className="font-semibold text-foreground">{currentGroup.client.tradeName}</span>
                    </DialogDescription>
                    <div className="mt-2 text-sm text-muted-foreground">
                        Total a fechar: <span className="font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
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
                                                    A Vista / Sem parcelamento
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="with_installments" id="with" />
                                                <Label htmlFor="with" className="font-normal cursor-pointer">
                                                    Com Parcelamento
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
                                                        <TableRow key={inst.number}>
                                                            <TableCell>{inst.number}</TableCell>
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

                        {closeOption === "without_installments" && (
                            <FormField
                                control={form.control}
                                name="overrideDueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vencimento (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Se não informado, usará o vencimento configurado no cadastro do cliente ({currentGroup.client.billingDueDay || "N/A"}).
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

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
                                {isSubmitting ? <span className="animate-spin mr-2">⏳</span> : null}
                                {isLast ? "Confirmar e Finalizar" : "Confirmar e Próximo"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
