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
import { z } from "zod";

type Material = z.infer<typeof MaterialSchema>

const MaterialSchema = z.object({
    materialName: z.string(),
    quantity: z.number().positive(),
    cost: z.number().nonnegative(),
})

const MaterialsResponseSchema = z.array(
    z.object({
        material: z.array(MaterialSchema),
    })
)

export default function Navbar() {
    const [ isOpen, setIsOpen ] = useState(false);
    const [ date, setDate ] = useState<Date>();
    const [ materials, setMaterials ] = useState<Material[]>([]);
    const [ costTotal, setCostTotal ] = useState<number>(0);

    const user = useUserContext();
    const navigate = useNavigate();

    const getTotal = (materials: Material[]) => {
        let total = 0;
        for (const item of materials) {
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
            if (!date) return;
            const formattedDate = format(date, "yyyy-MM-dd");

            const username = user?.user_metadata?.username;
            if (!username) {
                console.error("Username is undefined");
                return;
            }
            
            const { data, error } = await supabase
                .from('event')
                .select('material')
                .eq('date', formattedDate)
                .eq('username', username)

                if (error) {
                    console.error(error);
                    setMaterials([]);
                }   
                
                try {
                    const validated = MaterialsResponseSchema.parse(data);

                    const summedMaterials = validated
                    .flatMap(item => item.material)
                    .reduce<Material[]>((acc, { materialName, quantity, cost }) => {
                    const existing = acc.find(mat => mat.materialName === materialName && mat.cost === cost);

                    if (existing) {
                        existing.quantity += quantity;
                    } else {
                        acc.push({ materialName, quantity, cost });
                    }
                    
                    return acc;
                }, []);
                
                setMaterials(summedMaterials);
                getTotal(materials);
            } catch (err) {
                console.error("Error: ", err);
                setMaterials([]);
            }
        }   

        getMaterials();
    }, [date, user, supabase, materials]);
        
        
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
