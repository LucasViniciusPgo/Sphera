
import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AsyncSelectProps<T> {
    fetcher: (search: string) => Promise<T[]>
    value?: string
    onChange: (value: string) => void
    getLabel: (item: T) => string
    getValue: (item: T) => string
    renderOption?: (item: T) => React.ReactNode
    onSelectObject?: (item: T) => void
    initialLabel?: string
    placeholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
}

export function AsyncSelect<T>({
    fetcher,
    value,
    onChange,
    getLabel,
    getValue,
    renderOption,
    onSelectObject,
    initialLabel,
    placeholder = "Selecione...",
    emptyMessage = "Nenhum resultado encontrado.",
    className,
    disabled = false,
}: AsyncSelectProps<T>) {
    const [open, setOpen] = React.useState(false)
    const [options, setOptions] = React.useState<T[]>([])
    const [loading, setLoading] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [selectedLabel, setSelectedLabel] = React.useState<string>(initialLabel || "")

    // Atualizar label inicial se a prop mudar
    React.useEffect(() => {
        if (initialLabel) {
            setSelectedLabel(initialLabel)
        }
    }, [initialLabel])

    // Limpar label quando value for vazio
    React.useEffect(() => {
        if (!value || value === "") {
            setSelectedLabel("")
        }
    }, [value])

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchOptions(search)
        }, 300)

        return () => clearTimeout(timer)
    }, [search])

    const fetchOptions = async (term: string) => {
        setLoading(true)
        try {
            const data = await fetcher(term)
            setOptions(data)
        } catch (error) {
            console.error("Failed to fetch options", error)
            setOptions([])
        } finally {
            setLoading(false)
        }
    }

    // Quando abre o popover, se não tiver opções, busca as iniciais
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (newOpen && options.length === 0) {
            fetchOptions("")
        }
    }

    const handleSelect = (item: T) => {
        const val = getValue(item)
        const label = getLabel(item)
        onChange(val)
        if (onSelectObject) {
            onSelectObject(item)
        }
        setSelectedLabel(label)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                >
                    {selectedLabel ? selectedLabel : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandEmpty>
                        {loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Carregando...
                            </div>
                        ) : (
                            emptyMessage
                        )}
                    </CommandEmpty>

                    <div className="max-h-[300px] overflow-y-auto">
                        {!loading && options.length > 0 && (
                            <CommandGroup>
                                {options.map((item) => {
                                    const itemValue = getValue(item)
                                    const label = getLabel(item)
                                    return (
                                        <CommandItem
                                            key={itemValue}
                                            value={itemValue}
                                            onSelect={() => handleSelect(item)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === itemValue ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {renderOption ? renderOption(item) : label}
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        )}
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
