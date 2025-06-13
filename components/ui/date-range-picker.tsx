"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale" // Spanish locale
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined
  onDateChange: (range: DateRange | undefined) => void
  disabledDays?: any // You can be more specific with the type if needed
  numberOfMonths?: number
  className?: string // To style the button
}

export function DatePickerWithRange({
  date,
  onDateChange,
  disabledDays,
  numberOfMonths = 2,
  className,
}: DatePickerWithRangeProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  const handleSelect = (selectedRange: DateRange | undefined) => {
    onDateChange(selectedRange)
    // Optionally close popover on select, or keep it open for adjustments
    // if (selectedRange?.from && selectedRange?.to) {
    //   setPopoverOpen(false);
    // }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal professional-input", // Added professional-input for consistency
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: es })} - {format(date.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: es })
              )
            ) : (
              <span>Selecciona un rango</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
            locale={es} // Set locale for calendar
            disabled={disabledDays}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
