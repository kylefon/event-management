import { Calendar, MapPin, Package } from "lucide-react";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import supabase from "@/helper/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface Material {
    materialName: string;
    quantity: number;
    cost: number;
  }
  
export interface Event {
    name: string;
    address: string;
    date: string;
    eventType: string;
    material: Material[];
}

export default function EventCard({ event }: Event) {

    const { toast } = useToast();
    const getTotal = () => {
        let total = 0;
        for (const item of event.material) {
            const cost = Number(item.cost) || 0;
            const quantity = Number(item.quantity) || 1;
            total += cost * quantity;
        }

        return total;
    }

    const deleteEvent = async (id) => {
        const { data, error } = await supabase.from("event").delete().eq("id", id);

        if (error) {
            toast({
                title: "Error deleting event",
                description: `Error deleting ${event.name}`
            })
        } else {
            toast({
                title: "Successfully deleted event",
                description: `Deleted ${event.name}`
            })
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card>
                    <CardHeader>
                        <CardTitle>{event.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <MapPin />
                                <span>{event.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar />
                                <span>{format(event.date, "MM/dd/yyyy")}</span>
                            </div>
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                                {event.eventType}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="rounded">
                <DialogHeader>
                    <DialogTitle>{event.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <MapPin />
                        <span>{event.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar />
                        <span>{format(event.date, "MM/dd/yyyy")}</span>
                    </div>
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {event.eventType}
                    </div>
                    <div className="flex items-center gap-2">
                        <Package />
                        <h3 className="font-semibold">Materials</h3>
                    </div>
                    <div className="rounded border">
                        <div className="grid grid-cols-4 gap-4 p-4 font-medium text-sm">
                            <div>Material</div>
                            <div className="text-center">Quantity</div>
                            <div className="text-right">Cost</div>
                            <div className="text-right">Total</div>
                        </div>
                
                        <div className="divide-y">
                            {event.material.map((item, index) => (
                                <div key={index} className="grid grid-cols-4 gap-4 p-4 text-sm">
                                <div>{item.materialName}</div>
                                <div className="text-center">{item.quantity}</div>
                                <div className="text-right">₱{item.cost.toFixed(2)}</div>
                                <div className="text-right">₱{(item.quantity * item.cost).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                
                        <div className="border-t p-4">
                            <div className="flex justify-between items-center font-medium">
                                <span>Total Cost</span>
                                <span className="text-lg">₱{getTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <Button>Edit</Button>
                        <Button onClick={() => deleteEvent(event.id)} variant={"destructive"}>Delete</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}