import { z } from "zod"
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { addMinutes, format, parseISO, subMinutes } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "../ui/select";
import { useToast } from "@/hooks/use-toast";
import { Control, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import supabase from "@/helper/supabaseClient";

const FormSchema = z.object({
    id: z.number(),
    name: z
      .string()
      .min(2, {
        message: "Name must be at least 2 characters",
      })
      .max(255),
    address: z
      .string()
      .min(10, {
        message: "Name must be at least 10 characters",
      })
      .max(255),
    date: z.date(),
    eventType: z.string({ required_error: "Please select an event type." }),
    material: z
      .array(
        z.object({
          materialName: z
            .string()
            .min(2, { message: "Name must be at least 2 characters" }),
          quantity: z
            .number({ invalid_type_error: "Quantity must be a number" })
            .min(1, "Quantity must be at least 1"),
          cost: z
            .number({ invalid_type_error: "Cost must be a number" })
            .min(0, "Cost must be at least 0"),
        })
      )
      .optional(),
  });

  type Event = z.infer<typeof FormSchema>

  
export default function EditCard({ event }: { event: Event }) {

    const { toast } = useToast();

    const form = useForm<Event>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            ...event,
            date: parseISO(event.date.toString()), 
        }
    })

    const { control, handleSubmit} = form;

    const { fields, append, remove } = useFieldArray({
        control,
        name: "material",
    }) 

    const adjustForTimezone = (date: Date) => {
        const offset = date.getTimezoneOffset();
        return offset > 0 ? subMinutes(date, offset) : addMinutes(date, Math.abs(offset));
    }

    function getTotal(
    payload: Event["material"] = []
    ): number {
    let total = 0;

    for (const item of payload) {
        const cost = Number(item.cost) || 0;
        const quantity = Number(item.quantity) || 1;
        total += cost * quantity;
    }

    return total;
    }

    function TotalAmount({
        control,
        }: {
            control: Control<Event>;
        }) {
        const materialCost = useWatch({ control, name: "material" });
        const total = getTotal(materialCost);
        return <span>₱{total.toFixed(2)}</span>;
    }

    const onSubmit = async (data: Event) => {
        console.log("Form will be edited", data);

        const adjustedDate = adjustForTimezone(data.date);

        try {
            const { error } = await supabase
            .from("event")
            .update({
                name: data.name,
                address: data.address,
                date: adjustedDate,
                eventType: data.eventType,
                material: data.material,
            })
            .eq("id", data.id);

            if (error) throw error;

            toast({
                title: "Event Updated",
                description: `${data.name} has been saved`,
            })
        } catch(error) {
            console.error("Error updating event: ", error);
            toast({
                title: "Update Failed",
                description: "Something went wrong when updating the event.",
                variant: "destructive"
            })
        }
    }

    return (
        <div>
            <Form {...form}>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 max-w-3xl mx-auto"
                >
                    {/* Name field */}
                    <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder={event.name} {...field}/>
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {/* Address Field */}
                    <FormField
                        control={control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Input placeholder={event.address} {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="date"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover modal={true}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button variant={"outline"} >
                                        {field.value ? (
                                        format(field.value, "PPP")
                                        ) : (
                                        <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto bg-white shadow-lg p-0"
                                    align="start"              
                                >
                                    <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="eventType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <Select
                            onValueChange={field.onChange}
                            defaultValue={event.eventType}
                            >
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder={event.eventType} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Wedding">Wedding</SelectItem>
                                <SelectItem value="Birthday">Birthday</SelectItem>
                                <SelectItem value="Corporate">Corporate</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Materials</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                            append({
                                materialName: "",
                                quantity: 1,
                                cost: 0,
                            });
                            }}
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add Material
                        </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 items-start">
                            <FormField
                            control={control}
                            name={`material.${index}.materialName`}
                            render={({ field, fieldState }) => (
                                <FormItem>
                                <FormControl>
                                    <Input placeholder="Name" {...field} />
                                </FormControl>
                                {fieldState.error && (
                                    <p className="text-red-500 text-sm">
                                    {fieldState.error.message}
                                    </p>
                                )}
                                </FormItem>
                            )}
                            />

                            <FormField
                            control={control}
                            name={`material.${index}.quantity`}
                            render={({ field, fieldState }) => (
                                <FormItem>
                                <FormControl>
                                    <Input
                                    type="number"
                                    placeholder="Quantity"
                                    {...field}
                                    value={field.value}
                                    onChange={(e) =>
                                        field.onChange(e.target.valueAsNumber)
                                    }
                                    />
                                </FormControl>
                                {fieldState.error && (
                                    <p className="text-red-500 text-sm">
                                    {fieldState.error.message}
                                    </p>
                                )}
                                </FormItem>
                            )}
                            />

                            <FormField
                            control={control}
                            name={`material.${index}.cost`}
                            render={({ field, fieldState }) => (
                                <FormItem>
                                <FormControl>
                                    <Input
                                    type="number"
                                    placeholder="Cost"
                                    {...field}
                                    value={field.value}
                                    onChange={(e) =>
                                        field.onChange(e.target.valueAsNumber)
                                    }
                                    />
                                </FormControl>
                                {fieldState.error && (
                                    <p className="text-red-500 text-sm">
                                    {fieldState.error.message}
                                    </p>
                                )}
                                </FormItem>
                            )}
                            />

                            <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                            >
                            <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Cost:</span>
                        <span className="text-2xl font-bold">
                            <TotalAmount control={control} />
                        </span>
                        </div>
                    </div>
                            

                    <Button type="submit">Save Changes</Button>
                </form> 
            </Form>
        </div>
    )
}