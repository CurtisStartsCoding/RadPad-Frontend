import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ScheduleOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  patientName: string;
  modality: string | null;
}

interface ScheduleOrderRequest {
  newStatus: "scheduled";
  scheduledDate: string;
  notes?: string;
}

const ScheduleOrderDialog = ({
  isOpen,
  onClose,
  orderId,
  patientName,
  modality
}: ScheduleOrderDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate time slots for the day (8 AM to 6 PM in 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        slots.push({ value: time, label: displayTime });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const scheduleMutation = useMutation({
    mutationFn: async (data: ScheduleOrderRequest) => {
      const response = await apiRequest('POST', `/api/radiology/orders/${orderId}/update-status`, data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to schedule order');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order Scheduled Successfully",
        description: `Order for ${patientName} has been scheduled for ${format(selectedDate!, 'PPP')} at ${timeSlots.find(slot => slot.value === selectedTime)?.label}`,
      });
      
      // Invalidate and refetch the orders
      queryClient.invalidateQueries({ queryKey: ['/api/radiology/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      // Reset form and close dialog
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Schedule Order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both a date and time for the appointment.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time into ISO string
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const scheduleData: ScheduleOrderRequest = {
      newStatus: "scheduled",
      scheduledDate: scheduledDateTime.toISOString(),
      notes: notes.trim() || undefined,
    };

    scheduleMutation.mutate(scheduleData);
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setNotes("");
    setIsCalendarOpen(false);
    onClose();
  };

  const isFormValid = selectedDate && selectedTime;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Order</DialogTitle>
          <DialogDescription>
            Schedule the {modality || 'imaging'} order for {patientName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Date Selection */}
          <div className="grid gap-2">
            <Label htmlFor="date">Appointment Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select appointment date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid gap-2">
            <Label htmlFor="time">Appointment Time</Label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.value}
                  variant={selectedTime === slot.value ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedTime(slot.value)}
                >
                  <Clock className="mr-1 h-3 w-3" />
                  {slot.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any scheduling notes or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={scheduleMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSchedule} 
            disabled={!isFormValid || scheduleMutation.isPending}
          >
            {scheduleMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleOrderDialog;