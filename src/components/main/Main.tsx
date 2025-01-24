import { useEffect, useState } from "react";
import EventCard from "../EventCard/EventCard";
import supabase from "@/helper/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { Input } from "../ui/input";
import { Popover, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { PopoverContent } from "@radix-ui/react-popover";
import { Calendar } from "../ui/calendar";

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

export default function Main() {
    const user = useUserContext();
    const [ events, setEvents ] = useState(null);
    const [ eventName, setEventName ] = useState(null);
    const [ date, setDate ] = useState<Event['date']>();
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
                setEvents(data);
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
            <div className="flex space-x-4">
                <Input 
                    type="text"
                    placeholder="Search..."
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="rounded"
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"}>
                            <CalendarIcon />
                            {date ? format(date, "MM/dd/yyyy"): <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto bg-white shadow-lg p-0" align="end">
                        <Calendar  
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                <Button onClick={() => setPastEvent(!pastEvent)}>
                    { pastEvent ? <span>Show Past Events</span> : <span>Hide Past Events</span> }
                </Button>
            </div>
            <div className="grid gap-2 grid-cols-auto-fit-repeat">
                {events && (
                    <>
                        {events.map((event, index) => (
                            <EventCard key={index} event={event} />
                        ))}
                    </>
                )}
            </div>
        </main>
    )
}