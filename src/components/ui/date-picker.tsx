"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string; // Formato: "15 Dic 2024"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "Selecciona una fecha", className, required }: DatePickerProps) {
  // Convertir string "15 Dic 2024" a Date
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    
    const months: { [key: string]: number } = {
      'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    };

    try {
      const parts = dateString.toLowerCase().split(' ');
      if (parts.length !== 3) return undefined;

      const day = parseInt(parts[0]);
      const month = months[parts[1].substring(0, 3)];
      const year = parseInt(parts[2]);

      if (isNaN(day) || month === undefined || isNaN(year)) return undefined;

      return new Date(year, month, day);
    } catch {
      return undefined;
    }
  };

  // Convertir Date a string "15 Dic 2024"
  const formatDateToString = (date: Date): string => {
    return format(date, "d MMM yyyy", { locale: es });
  };

  const [date, setDate] = React.useState<Date | undefined>(() => parseDate(value || ''));

  React.useEffect(() => {
    if (value) {
      const parsed = parseDate(value);
      setDate(parsed);
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const formatted = formatDateToString(selectedDate);
      onChange(formatted);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground text-left justify-start font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDateToString(date) : <span>{placeholder}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  );
}

