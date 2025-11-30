import { Fragment, useEffect, useMemo, useState } from "react";
import {
    addDays,
    endOfDay,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameHour,
    parseISO,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
} from "lucide-react";

import {
    getUserScheduleEvents,
    createScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    type ScheduleEvent,
    type CreateScheduleEventCommand,
} from "@/services/schedulesService";

import { getClients, type ClientDetails } from "@/services/clientsService";

type CalendarView = "day" | "week" | "month";

const HOURS_RANGE = { start: 7, end: 20 }; // 7h às 20h

function getRangeForView(view: CalendarView, baseDate: Date) {
    if (view === "day") {
        const start = startOfDay(baseDate);
        const end = endOfDay(baseDate);
        return { start, end };
    }
    if (view === "week") {
        const start = startOfWeek(baseDate, { weekStartsOn: 1 });
        const end = endOfWeek(baseDate, { weekStartsOn: 1 });
        return { start, end };
    }
    const start = startOfMonth(baseDate);
    const end = endOfMonth(baseDate);
    return { start, end };
}

function addMonthsSafe(date: Date, amount: number) {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() + amount);
    return copy;
}

function setHourSafe(day: Date, hour: number) {
    const d = new Date(day);
    d.setHours(hour, 0, 0, 0);
    return d;
}

const Agenda = () => {
    const [view, setView] = useState<CalendarView>("week");
    const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formDateTime, setFormDateTime] = useState<string>("");
    const [formClientId, setFormClientId] = useState<string>("");
    const [formNotes, setFormNotes] = useState<string>("");
    const [clients, setClients] = useState<ClientDetails[]>([]);

    // ⚠️ aqui precisa estar o GUID do usuário logado
    const currentUserId = localStorage.getItem("currentUserId") || "";

    const weekDays = useMemo(() => {
        const { start } = getRangeForView("week", currentDate);
        return Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));
    }, [currentDate]);

    const { start, end } = useMemo(
        () => getRangeForView(view, currentDate),
        [view, currentDate]
    );

    useEffect(() => {
        // Carrega lista de clientes para o Select (primeiras 100 entradas)
        getClients({ pageSize: 100 })
            .then((res) => setClients(res.items))
            .catch(() => {
                setClients([]);
            });
    }, []);

    useEffect(() => {
        if (!currentUserId) return;

        const load = async () => {
            setLoading(true);
            try {
                const data = await getUserScheduleEvents(currentUserId, {
                    startAt: start.toISOString(),
                    endAt: end.toISOString(),
                });
                setEvents(data);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [currentUserId, start, end]);

    function openCreateDialog(date: Date) {
        setEditingId(null);
        setFormDateTime(format(date, "yyyy-MM-dd'T'HH:mm"));
        setFormClientId("");
        setFormNotes("");
        setDialogOpen(true);
    }

    function openEditDialog(event: ScheduleEvent) {
        setEditingId(event.id);
        setFormDateTime(
            format(parseISO(event.occurredAt), "yyyy-MM-dd'T'HH:mm")
        );
        setFormClientId(event.clientId);
        setFormNotes(event.notes || "");
        setDialogOpen(true);
    }

    async function handleSubmit() {
        if (!currentUserId) {
            alert(
                "Usuário logado não encontrado. Salve o GUID do usuário em localStorage.currentUserId após o login."
            );
            return;
        }

        const occurredAt = new Date(formDateTime).toISOString();
        const payload: CreateScheduleEventCommand = {
            occurredAt,
            userId: currentUserId,
            clientId: formClientId,
            notes: formNotes || undefined,
        };

        setLoading(true);
        try {
            if (editingId) {
                await updateScheduleEvent(editingId, payload);
            } else {
                await createScheduleEvent(payload);
            }

            const data = await getUserScheduleEvents(currentUserId, {
                startAt: start.toISOString(),
                endAt: end.toISOString(),
            });
            setEvents(data);
            setDialogOpen(false);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!editingId) return;
        if (!currentUserId) return;

        setLoading(true);
        try {
            await deleteScheduleEvent(editingId);
            const data = await getUserScheduleEvents(currentUserId, {
                startAt: start.toISOString(),
                endAt: end.toISOString(),
            });
            setEvents(data);
            setDialogOpen(false);
        } finally {
            setLoading(false);
        }
    }

    function goToday() {
        setCurrentDate(new Date());
    }

    function goPrev() {
        setCurrentDate((prev) => {
            if (view === "day") return addDays(prev, -1);
            if (view === "week") return addDays(prev, -7);
            return addMonthsSafe(prev, -1);
        });
    }

    function goNext() {
        setCurrentDate((prev) => {
            if (view === "day") return addDays(prev, 1);
            if (view === "week") return addDays(prev, 7);
            return addMonthsSafe(prev, 1);
        });
    }

    function renderHeaderTitle() {
        if (view === "day") {
            return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        }
        if (view === "week") {
            const { start, end } = getRangeForView("week", currentDate);
            return `${format(start, "dd MMM", { locale: ptBR })} - ${format(
                end,
                "dd MMM yyyy",
                { locale: ptBR }
            )}`;
        }
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }

    function renderWeekGrid() {
        const hours = Array.from(
            { length: HOURS_RANGE.end - HOURS_RANGE.start + 1 },
            (_, idx) => HOURS_RANGE.start + idx
        );

        return (
            <div className="border rounded-lg overflow-hidden">
                {/* Cabeçalho com dias da semana */}
                <div className="grid grid-cols-[64px_repeat(7,1fr)] bg-muted text-xs">
                    <div className="border-r border-border flex items-center justify-center py-2">
                        <Clock className="h-4 w-4" />
                    </div>
                    {weekDays.map((day) => {
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div
                                key={day.toISOString()}
                                className="border-r border-border text-center py-2"
                            >
                                <div className="uppercase text-[0.7rem] text-muted-foreground">
                                    {format(day, "EEE", { locale: ptBR })}
                                </div>
                                <div
                                    className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm ${
                                        isToday
                                            ? "bg-primary text-primary-foreground"
                                            : "text-foreground"
                                    }`}
                                >
                                    {format(day, "d")}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Corpo: grades por hora x dia (estilo Google Calendar semana) */}
                <div className="grid grid-cols-[64px_repeat(7,1fr)] text-xs">
                    {hours.map((hour) => (
                        <Fragment key={hour}>
                            {/* coluna da hora */}
                            <div className="border-t border-border border-r px-1 py-2 text-right text-muted-foreground">
                                {hour.toString().padStart(2, "0")}:00
                            </div>

                            {/* colunas dos dias */}
                            {weekDays.map((day) => {
                                const slotDate = setHourSafe(day, hour);
                                const slotEvents = events.filter((event) => {
                                    const date = parseISO(event.occurredAt);
                                    return isSameDay(date, slotDate) && isSameHour(date, slotDate);
                                });

                                return (
                                    <div
                                        key={day.toISOString() + hour}
                                        className="relative border-t border-r border-border h-16 hover:bg-muted/50 cursor-pointer"
                                        onDoubleClick={() => openCreateDialog(slotDate)}
                                    >
                                        {slotEvents.map((event) => (
                                            <button
                                                key={event.id}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditDialog(event);
                                                }}
                                                className="absolute inset-1 rounded-md bg-primary/10 border border-primary/50 px-1 py-0.5 text-[0.7rem] text-left overflow-hidden hover:bg-primary/20"
                                            >
                                                <div className="font-medium truncate">
                                                    {clients.find((c) => c.id === event.clientId)
                                                        ?.tradeName || "Cliente"}
                                                </div>
                                                {event.notes && (
                                                    <div className="truncate opacity-80">
                                                        {event.notes}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </Fragment>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Card className="w-full h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle className="text-xl">Agenda</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Visualize e gerencie seus agendamentos de atendimento por cliente.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToday}>
                        Hoje
                    </Button>

                    <div className="flex items-center border rounded-md overflow-hidden">
                        <Button variant="ghost" size="icon" onClick={goPrev}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-3 text-sm font-medium whitespace-nowrap">
                            {renderHeaderTitle()}
                        </div>
                        <Button variant="ghost" size="icon" onClick={goNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Tabs
                        value={view}
                        onValueChange={(v) => setView(v as CalendarView)}
                        className="ml-2"
                    >
                        <TabsList>
                            <TabsTrigger value="day">Dia</TabsTrigger>
                            <TabsTrigger value="week">Semana</TabsTrigger>
                            <TabsTrigger value="month">Mês</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4">
                {/* Para simplificar, implementamos só o modo semanal,
            que é o mais parecido com o Google Calendar */}
                {renderWeekGrid()}
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Editar agendamento" : "Novo agendamento"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                Data e hora
                            </label>
                            <Input
                                type="datetime-local"
                                value={formDateTime}
                                onChange={(e) => setFormDateTime(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                Cliente
                            </label>
                            <Select
                                value={formClientId}
                                onValueChange={setFormClientId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.tradeName} ({client.cnpj})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                Observações
                            </label>
                            <Textarea
                                value={formNotes}
                                onChange={(e) => setFormNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2">
                        {editingId && (
                            <Button
                                variant="destructive"
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                Excluir
                            </Button>
                        )}
                        <div className="ml-auto flex gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setDialogOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {editingId ? "Salvar" : "Agendar"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default Agenda;