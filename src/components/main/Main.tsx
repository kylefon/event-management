import { useEffect, useState } from "react";
import EventCard from "../EventCard/EventCard";
import supabase from "@/helper/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { Input } from "../ui/input";
import { Popover, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { CalendarIcon, TicketCheck, TicketX } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { PopoverContent } from "@radix-ui/react-popover";
import { Calendar } from "../ui/calendar";
import { z } from "zod";

const MaterialSchema = z.object({
    materialName: z.string(),
    quantity: z.number().positive(),
    cost: z.number().nonnegative(),
})

const EventSchema = z.object({
    id: z.number(),
    name: z.string(),
    address: z.string(),
    date: z.date(),
    eventType: z.string(),
    material: z.array(MaterialSchema),
})

type Event = z.infer<typeof EventSchema>

export default function Main() {
    const user = useUserContext();
    const [ events, setEvents ] = useState<Event[] | null>(null);
    const [eventName, setEventName] = useState<string | null>(null);
    const [ date, setDate ] = useState<Date | null >();
    const [ pastEvent, setPastEvent ] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            let query = supabase
            .from('event')
            .select()
            .eq('username', user?.user_metadata?.username)

            if (eventName) {
                query = query.textSearch("name", eventName);
            }

            if (date) {
                const formattedDate = format(startOfDay(date), "yyyy-MM-dd");
                query = query.eq('date', formattedDate)
                console.log("Changed date to", formattedDate);
            }

            if (pastEvent) {
                const currentDate = format(Date.now(), "yyyy-MM-dd");
                query = query.gte('date', currentDate);
                console.log("Showing past events", currentDate);
            }

            const { data, error } = await query;

            if (error) {
                setEvents(null);
                console.log(error);
            }

            if (data) {
                try {
                    const validatedData = z.array(EventSchema).parse(data);
                    setEvents(validatedData);
                } catch (err) {
                    console.error("Error: ", err);
                    setEvents(null);
                }
            }
        }

        fetchEvents();

        const channel = supabase
        .channel('table_db_changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'event',
        }, (payload) => {
            console.log("Changes received: ", payload);
            fetchEvents();
        }).subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        }    
    }, [supabase, eventName, user, date, pastEvent])

    return (
        <main className="space-y-6">
            <div className="flex max-sm:flex-col gap-5">
                <Input 
                    type="text"
                    placeholder="Search..."
                    value={eventName || ""}
                    onChange={(e) => setEventName(e.target.value)}
                    className="rounded"
                />
                <div className="flex gap-3 mx-sm:w-full">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"secondary"} className="w-full">
                                <div className="flex gap-2 max-sm:hidden">
                                    <CalendarIcon/>
                                    {date ? <span>{format(date, "MM/dd/yyyy")}</span>: <span>Pick a date</span>}
                                </div>
                                <div className="hidden max-sm:block">
                                    {date ? <span>{format(date, "MM/dd/yyyy")}</span>: <span><CalendarIcon/></span>}
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto bg-white shadow-lg p-0" align="end">
                            <Calendar  
                                mode="single"
                                selected={date || undefined }
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button className="w-full" onClick={() => setPastEvent(!pastEvent)}>
                        <div className="max-sm:hidden">
                            { pastEvent ? <span>Show Past Events</span> : <span>Hide Past Events</span> }
                        </div>
                        <div className="hidden max-sm:block">
                            { pastEvent ? <span><TicketCheck /></span> : <span><TicketX/></span> }
                        </div>
                    </Button>
                </div>
            </div>
            <div className="grid gap-2 grid-cols-auto-fit-repeat">
                {events && events.map((event: Event, index: number) => (
                    <EventCard key={index} event={event} />
                ))}
            </div>
        </main>
    )
}