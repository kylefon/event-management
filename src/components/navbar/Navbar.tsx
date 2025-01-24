import supabase from "@/helper/supabaseClient"
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import Receipt from "../receipt/Receipt";
import { useUserContext } from "@/context/UserContext";
import { CalendarIcon, CirclePlus, Package } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { useEffect, useState } from "react";

export default function Navbar() {
    const [ isOpen, setIsOpen ] = useState(false);
    const [ date, setDate ] = useState();
    const [ materials, setMaterials ] = useState([]);
    const [ costTotal, setCostTotal ] = useState();

    const user = useUserContext();
    const navigate = useNavigate();

    const getTotal = (event) => {
        let total = 0;
        for (const item of event) {
            const cost = Number(item.cost) || 0;
            const quantity = Number(item.quantity) || 1;
            total += cost * quantity;
        }

        setCostTotal(total);
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        navigate("/login");
    };

    useEffect(() => {
        const getMaterials = async () => {
            console.log("Getting materials")
            if (date) {
                console.log("Date", date)
                const formattedDate = format(date, "yyyy-MM-dd");
                console.log("formatted date", formattedDate)
                const { data, error } = await supabase
                .from('event')
                .select('material')
                .eq('date', formattedDate)
                .eq('username', user?.user_metadata?.username)

                if (error) {
                    console.error(error);
                    setMaterials([]);
                } else {   
                    console.log(`Materials for ${formattedDate} is`, data)

                    const summedMaterials = data
                    .flatMap(item => item.material)
                    .reduce((acc, { materialName, quantity, cost }) => {
                        const existing = acc.find(mat => mat.materialName === materialName);

                        if (existing) {
                            existing.quantity += quantity;
                            existing.cost += cost;
                        } else {
                            acc.push({ materialName, quantity, cost });
                        }

                        return acc;
                    }, []);

                    console.log("SUMMARY: ", materials);
                    setMaterials(summedMaterials);
                }

                if (materials) {
                    getTotal(materials);
                }
            }
        }   
        
        getMaterials();
    }, [date, supabase, materials, user])
        
    return (
        <nav className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{user?.user_metadata?.username || "Guest"}</h1>
            <div className="space-x-2 flex items-center" >
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded" variant={"ghost"}><Package /> View Daily Materials</Button>
                    </DialogTrigger>
                    <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle>Daily Materials</DialogTitle>
                        </DialogHeader>
                        <Popover modal={true}>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className="w-full">
                                    <CalendarIcon />
                                    {date ? format(date, "MM/dd/yyyy"): <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto bg-white shadow-lg p-0" align="center">
                                <Calendar  
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus                              
                                />
                            </PopoverContent>
                        </Popover>
                        { date && materials.length > 0 ? (
                            <div className="space-y-2">
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
                                        {materials.map((item, index) => (
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
                                            <span className="text-lg">₱{costTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ) : (
                            <span>No Materials</span>
                        )}
                    </DialogContent>
                </Dialog>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="rounded bg-green-500"><CirclePlus /> Add Event</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl">
                        <DialogHeader>
                            <DialogTitle>Event Details</DialogTitle>
                        </DialogHeader>
                        <Receipt />
                    </DialogContent>
                </Dialog>
                <Button onClick={signOut} variant={"destructive"} className="rounded">Sign Out</Button>
            </div>
        </nav> 
    );
}
