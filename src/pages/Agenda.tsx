import {
    Fragment,
    useEffect,
    useMemo,
    useState,
    type DragEvent,
} from "react";
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
    getScheduleEvents,
    createScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    type ScheduleEvent,
    type CreateScheduleEventCommand,
} from "@/services/schedulesService";

import { getClients, type ClientDetails } from "@/services/clientsService";
import { getUsers } from "@/services/usersServices";
import type { Usuario } from "@/interfaces/Usuario";

type CalendarView = "day" | "week" | "month";

const HOURS_RANGE = { start: 7, end: 20 }; // 7h às 20h

const ALL_CLIENTS = "all_clients";
const ALL_USERS = "all_users";
const NONE_CLIENT = "none_client";
const NONE_USER = "none_user";

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

function toApiDateTime(date: Date) {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

const Agenda = () => {
    const [view, setView] = useState<CalendarView>("month");
    const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formDateTime, setFormDateTime] = useState<string>("");

    // agora usando sentinelas, nunca string vazia
    const [formClientId, setFormClientId] = useState<string>(NONE_CLIENT);
    const [formUserId, setFormUserId] = useState<string>(NONE_USER);
    const [formNotes, setFormNotes] = useState<string>("");

    const [clients, setClients] = useState<ClientDetails[]>([]);
    const [users, setUsers] = useState<Usuario[]>([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const [filterClientId, setFilterClientId] =
        useState<string>(ALL_CLIENTS);
    const [filterUserId, setFilterUserId] = useState<string>(ALL_USERS);

    const filteredEvents = useMemo(() => {
        let list = events;

        if (filterClientId !== ALL_CLIENTS) {
            list = list.filter((ev) => ev.clientId === filterClientId);
        }

        if (filterUserId !== ALL_USERS) {
            list = list.filter((ev) => ev.userId === filterUserId);
        }

        return list;
    }, [events, filterClientId, filterUserId]);


    const weekDays = useMemo(() => {
        const { start } = getRangeForView("week", currentDate);
        return Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));
    }, [currentDate]);

    const { start, end } = useMemo(
        () => getRangeForView(view, currentDate),
        [view, currentDate]
    );

    useEffect(() => {
        getClients({ pageSize: 100 })
            .then((res) => setClients(res.items))
            .catch(() => {
                setClients([]);
            });

        getUsers({ isActive: true, pageSize: 100 })
            .then((items) => setUsers(items))
            .catch(() => {
                setUsers([]);
            });
    }, []);

    async function loadEvents() {
        setLoading(true);
        try {
            const params: {
                startAt: string;
                endAt: string;
            } = {
                startAt: toApiDateTime(start),
                endAt: toApiDateTime(end),
            };

            const data = await getScheduleEvents(params);
            setEvents(data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadEvents();
    }, [start, end]);

    function openCreateDialog(date: Date) {
        setEditingId(null);
        setFormDateTime(format(date, "yyyy-MM-dd'T'HH:mm"));
        setFormClientId(NONE_CLIENT);
        setFormUserId(NONE_USER);
        setFormNotes("");
        setDialogOpen(true);
    }

    function openEditDialog(event: ScheduleEvent) {
        setEditingId(event.id);
        setFormDateTime(
            format(parseISO(event.occurredAt), "yyyy-MM-dd'T'HH:mm")
        );
        setFormClientId(event.clientId ?? NONE_CLIENT);
        setFormUserId(event.userId ?? NONE_USER);
        setFormNotes(event.notes || "");
        setDialogOpen(true);
    }

    async function reloadEvents() {
        await loadEvents();
    }

    async function handleSubmit() {
        const localDate = new Date(formDateTime);
        const occurredAt = toApiDateTime(localDate);

        const payload: CreateScheduleEventCommand = {
            occurredAt,
            userId: formUserId === NONE_USER ? null : formUserId,
            clientId: formClientId === NONE_CLIENT ? null : formClientId,
            notes: formNotes || null,
        };

        setLoading(true);
        try {
            if (editingId) {
                await updateScheduleEvent(editingId, payload);
            } else {
                await createScheduleEvent(payload);
            }

            await reloadEvents();
            setDialogOpen(false);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        setLoading(true);
        try {
            await deleteScheduleEvent(id);
            await reloadEvents();
            setDialogOpen(false);
        } finally {
            setLoading(false);
        }
    }

    function handleEventDragStart(
        e: DragEvent<HTMLButtonElement>,
        event: ScheduleEvent
    ) {
        e.dataTransfer.setData("text/event-id", event.id);
        e.dataTransfer.effectAllowed = "move";
    }

    function handleSlotDragOver(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }

    async function handleMoveEvent(eventId: string, newDate: Date) {
        const schedule = events.find((ev) => ev.id === eventId);
        if (!schedule) return;

        const occurredAt = toApiDateTime(newDate);

        const payload: CreateScheduleEventCommand = {
            occurredAt,
            userId: schedule.userId ?? null,
            clientId: schedule.clientId ?? null,
            notes: schedule.notes ?? null,
        };

        setEvents((prev) =>
            prev.map((ev) =>
                ev.id === schedule.id ? { ...ev, occurredAt } : ev
            )
        );

        setLoading(true);
        try {
            await updateScheduleEvent(schedule.id, payload);
            await reloadEvents();
        } finally {
            setLoading(false);
        }
    }

    function handleSlotDrop(e: DragEvent<HTMLDivElement>, slotDate: Date) {
        e.preventDefault();
        const eventId = e.dataTransfer.getData("text/event-id");
        if (!eventId) return;
        void handleMoveEvent(eventId, slotDate);
    }

    function handleMonthDayDrop(e: DragEvent<HTMLDivElement>, dayDate: Date) {
        e.preventDefault();
        const eventId = e.dataTransfer.getData("text/event-id");
        if (!eventId) return;

        const schedule = events.find((ev) => ev.id === eventId);
        if (!schedule) return;

        const original = parseISO(schedule.occurredAt);
        const target = new Date(dayDate);
        target.setHours(original.getHours(), original.getMinutes(), 0, 0);

        void handleMoveEvent(eventId, target);
    }

    function goToday() {
        const today = new Date();
        setCurrentDate(today);
        setView("day");
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
            return format(currentDate, "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
            });
        }
        if (view === "week") {
            const { start, end } = getRangeForView("week", currentDate);
            return `${format(start, "dd MMM", {
                locale: ptBR,
            })} - ${format(end, "dd MMM yyyy", { locale: ptBR })}`;
        }
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }

    function renderWeekGrid() {
        const hours = Array.from(
            { length: HOURS_RANGE.end - HOURS_RANGE.start + 1 },
            (_, idx) => HOURS_RANGE.start + idx
        );

        return (
            <div className="border rounded-lg overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Cabeçalho com dias da semana */}
                        <div className="grid grid-cols-[64px_repeat(7,1fr)] bg-muted text-xs sticky top-0 z-10">
                            <div className="border-r border-border flex items-center justify-center py-2 sticky left-0 bg-muted z-20">
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
                                            className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm ${isToday
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

                        {/* Corpo: grades por hora x dia */}
                        <div className="grid grid-cols-[64px_repeat(7,1fr)] text-xs">
                            {hours.map((hour) => (
                                <Fragment key={hour}>
                                    {/* coluna da hora */}
                                    <div className="border-t border-border border-r px-1 py-2 text-right text-muted-foreground sticky left-0 bg-background z-10">
                                        {hour.toString().padStart(2, "0")}:00
                                    </div>

                                    {/* colunas dos dias */}
                                    {weekDays.map((day) => {
                                        const slotDate = setHourSafe(day, hour);
                                        const slotEvents = filteredEvents.filter((event) => {
                                            const date = parseISO(event.occurredAt);
                                            return (
                                                isSameDay(date, slotDate) &&
                                                isSameHour(date, slotDate)
                                            );
                                        });

                                        return (
                                            <div
                                                key={day.toISOString() + hour}
                                                className="border-t border-r border-border h-16 hover:bg-muted/50 cursor-pointer px-1 py-0.5 flex flex-col gap-1 min-w-0"
                                                onDoubleClick={() =>
                                                    openCreateDialog(slotDate)
                                                }
                                                onDragOver={handleSlotDragOver}
                                                onDrop={(e) =>
                                                    handleSlotDrop(e, slotDate)
                                                }
                                            >
                                                {slotEvents.map((event) => {
                                                    const client = clients.find((c) => c.id === event.clientId);
                                                    const user = users.find((u) => u.id === event.userId);

                                                    return (
                                                        <button
                                                            key={event.id}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditDialog(event);
                                                            }}
                                                            draggable
                                                            onDragStart={(e) =>
                                                                handleEventDragStart(e, event)
                                                            }
                                                            className="w-full rounded-md bg-primary/10 border border-primary/50 px-1 py-0.5 text-[0.7rem] text-left overflow-hidden hover:bg-primary/20"
                                                        >
                                                            {client && (
                                                                <div className="font-medium truncate">
                                                                    {client.legalName}
                                                                </div>
                                                            )}

                                                            {user && (
                                                                <div className="font-medium truncate">
                                                                    {user.name}
                                                                </div>
                                                            )}

                                                            {event.notes && (
                                                                <div className="truncate opacity-80">
                                                                    {event.notes}
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderDayGrid() {
        const hours = Array.from(
            { length: HOURS_RANGE.end - HOURS_RANGE.start + 1 },
            (_, idx) => HOURS_RANGE.start + idx
        );

        const day = currentDate;

        return (
            <div className="border rounded-lg overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <div className="min-w-[400px]">
                        {/* Cabeçalho com o dia */}
                        <div className="grid grid-cols-[64px_1fr] bg-muted text-xs sticky top-0 z-10">
                            <div className="border-r border-border flex items-center justify-center py-2 sticky left-0 bg-muted z-20">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div className="text-center py-2">
                                <div className="uppercase text-[0.7rem] text-muted-foreground">
                                    {format(day, "EEEE", { locale: ptBR })}
                                </div>
                                <div
                                    className="inline-flex w-7 h-7 items-center justify-center rounded-full text-sm bg-primary text-primary-foreground">
                                    {format(day, "d")}
                                </div>
                            </div>
                        </div>

                        {/* Corpo: grades por hora no dia */}
                        <div className="grid grid-cols-[64px_1fr] text-xs">
                            {hours.map((hour) => {
                                const slotDate = setHourSafe(day, hour);
                                const slotEvents = filteredEvents.filter((event) => {
                                    const date = parseISO(event.occurredAt);
                                    return (
                                        isSameDay(date, slotDate) &&
                                        isSameHour(date, slotDate)
                                    );
                                });

                                return (
                                    <Fragment key={hour}>
                                        <div
                                            className="border-t border-border border-r px-1 py-2 text-right text-muted-foreground sticky left-0 bg-background z-10">
                                            {hour.toString().padStart(2, "0")}:00
                                        </div>
                                        <div
                                            className="border-t border-border h-16 hover:bg-muted/50 cursor-pointer px-1 py-0.5 flex flex-col gap-1 min-w-0"
                                            onDoubleClick={() =>
                                                openCreateDialog(slotDate)
                                            }
                                            onDragOver={handleSlotDragOver}
                                            onDrop={(e) =>
                                                handleSlotDrop(e, slotDate)
                                            }
                                        >
                                            {slotEvents.map((event) => {
                                                const client = clients.find((c) => c.id === event.clientId);
                                                const user = users.find((u) => u.id === event.userId);

                                                return (
                                                    <button
                                                        key={event.id}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditDialog(event);
                                                        }}
                                                        draggable
                                                        onDragStart={(e) =>
                                                            handleEventDragStart(e, event)
                                                        }
                                                        className="w-full rounded-md bg-primary/10 border border-primary/50 px-1 py-0.5 text-[0.7rem] text-left overflow-hidden hover:bg-primary/20"
                                                    >
                                                        {client && (
                                                            <div className="font-medium truncate">
                                                                {client.legalName}
                                                            </div>
                                                        )}

                                                        {user && (
                                                            <div className="font-medium truncate">
                                                                {user.name}
                                                            </div>
                                                        )}

                                                        {event.notes && (
                                                            <div className="truncate opacity-80">
                                                                {event.notes}
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderMonthGrid() {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const days: Date[] = [];
        let d = gridStart;
        while (d <= gridEnd) {
            days.push(d);
            d = addDays(d, 1);
        }

        const weekDayLabels = Array.from({ length: 7 }).map((_, idx) =>
            addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), idx)
        );

        return (
            <div className="border rounded-lg overflow-hidden">
                {/* Cabeçalho com dias da semana */}
                <div className="grid grid-cols-7 bg-muted text-xs">
                    {weekDayLabels.map((day) => (
                        <div
                            key={day.toISOString()}
                            className="border-r last:border-r-0 border-border text-center py-2 uppercase text-[0.7rem] text-muted-foreground"
                        >
                            {format(day, "EEE", { locale: ptBR })}
                        </div>
                    ))}
                </div>

                {/* Corpo: grade mensal */}
                <div className="grid grid-cols-7 text-xs">
                    {days.map((day) => {
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth =
                            day.getMonth() === monthStart.getMonth();

                        const dayEvents = filteredEvents
                            .filter((event) =>
                                isSameDay(parseISO(event.occurredAt), day)
                            )
                            .sort(
                                (a, b) =>
                                    parseISO(a.occurredAt).getTime() -
                                    parseISO(b.occurredAt).getTime()
                            );

                        const defaultCreateDate = setHourSafe(day, 9);

                        return (
                            <div
                                key={day.toISOString()}
                                className={`border border-border min-h-[96px] p-1 align-top cursor-pointer hover:bg-muted/40 ${!isCurrentMonth
                                    ? "bg-muted/10"
                                    : "bg-background"
                                    }`}
                                onDoubleClick={() =>
                                    openCreateDialog(defaultCreateDate)
                                }
                                onDragOver={handleSlotDragOver}
                                onDrop={(e) => handleMonthDayDrop(e, day)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div
                                        className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs ${isToday
                                            ? "bg-primary text-primary-foreground"
                                            : "text-foreground"
                                            }`}
                                    >
                                        {format(day, "d")}
                                    </div>
                                </div>

                                <div className="space-y-0.5">
                                    {dayEvents.map((event) => {
                                        const date = parseISO(event.occurredAt);
                                        const timeLabel = format(date, "HH:mm");

                                        const client = clients.find((c) => c.id === event.clientId);
                                        const user = users.find((u) => u.id === event.userId);

                                        return (
                                            <button
                                                key={event.id}
                                                type="button"
                                                className="w-full text-left truncate rounded px-1 py-0.5 text-[0.7rem] bg-primary/10 hover:bg-primary/20 border border-primary/40"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditDialog(event);
                                                }}
                                                draggable
                                                onDragStart={(e) =>
                                                    handleEventDragStart(e, event)
                                                }
                                            >
                                                <span className="font-semibold">
                                                    {timeLabel}{" "}
                                                </span>
                                                {client && (
                                                    <span className="truncate inline-block max-w-[80%] align-middle">
                                                        {client.legalName}
                                                    </span>
                                                )}

                                                {user && (
                                                    <div className="font-medium truncate">
                                                        {user.name}
                                                    </div>
                                                )}

                                                {event.notes && (
                                                    <div className="truncate opacity-80">
                                                        {event.notes}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}

                                </div>
                            </div>
                        );
                    })}
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
                            Visualize e gerencie seus agendamentos de atendimento
                            por cliente.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={goToday}>
                        Hoje
                    </Button>

                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => openCreateDialog(new Date())}
                    >
                        Novo Agendamento
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
                {/* Filtros de Agenda (Cliente / Usuário opcionais) */}
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                            Filtrar por cliente
                        </label>
                        <Select
                            value={filterClientId}
                            onValueChange={setFilterClientId}
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_CLIENTS}>
                                    Todos os clientes
                                </SelectItem>
                                {clients.map((client) => (
                                    <SelectItem
                                        key={client.id}
                                        value={client.id}
                                    >
                                        {client.tradeName} ({client.cnpj})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                            Filtrar por usuário
                        </label>
                        <Select
                            value={filterUserId}
                            onValueChange={setFilterUserId}
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_USERS}>
                                    Todos os usuários
                                </SelectItem>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {view === "day" && renderDayGrid()}
                {view === "week" && renderWeekGrid()}
                {view === "month" && renderMonthGrid()}
            </CardContent>

            {/* Modal de criação / edição */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId
                                ? "Editar agendamento"
                                : "Novo agendamento"}
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
                                onChange={(e) =>
                                    setFormDateTime(e.target.value)
                                }
                            />
                        </div>

                        {/* Cliente opcional */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                Cliente (opcional)
                            </label>
                            <Select
                                value={formClientId}
                                onValueChange={setFormClientId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Nenhum cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE_CLIENT}>
                                        Nenhum cliente
                                    </SelectItem>
                                    {clients.map((client) => (
                                        <SelectItem
                                            key={client.id}
                                            value={client.id}
                                        >
                                            {client.tradeName} ({client.cnpj})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Usuário opcional */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                Usuário (opcional)
                            </label>
                            <Select
                                value={formUserId}
                                onValueChange={setFormUserId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Nenhum usuário" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE_USER}>
                                        Nenhum usuário
                                    </SelectItem>
                                    {users.map((user) => (
                                        <SelectItem
                                            key={user.id}
                                            value={user.id}
                                        >
                                            {user.name} ({user.email})
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
                                onChange={(e) =>
                                    setFormNotes(e.target.value)
                                }
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2">
                        {editingId && (
                            <Button
                                variant="destructive"
                                type="button"
                                onClick={() => {
                                    if (!editingId) return;
                                    setPendingDeleteId(editingId);
                                    setDeleteConfirmOpen(true);
                                }}
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

            {/* Confirmação de exclusão */}
            <Dialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar exclusão</DialogTitle>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground">
                        Tem certeza que deseja excluir este agendamento?
                        Essa ação não pode ser desfeita.
                    </p>

                    <DialogFooter className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setDeleteConfirmOpen(false)}
                        >
                            Cancelar
                        </Button>

                        <Button
                            variant="destructive"
                            type="button"
                            onClick={async () => {
                                if (!pendingDeleteId) return;
                                await handleDelete(pendingDeleteId);
                                setDeleteConfirmOpen(false);
                            }}
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default Agenda;