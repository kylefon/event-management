import { date, z } from "zod";
import { Control, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon, FileDown, PlusCircle, Trash2 } from "lucide-react";
import { addMinutes, format, subMinutes } from "date-fns";
import { Calendar } from "../ui/calendar";
import supabase from "@/helper/supabaseClient";
import { useUserContext } from "@/context/UserContext";

const FormSchema = z.object({
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

export default function Receipt() {

  const user = useUserContext();

  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      address: "",
      date: undefined,
      eventType: "",
      material: [{ materialName: "", quantity: 1, cost: 0 }],
    },
  });

  const { control, handleSubmit, formState } = form;
  const { errors } = formState;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "material",
  });

  function getTotal(
    payload: z.infer<typeof FormSchema>["material"] = []
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
    control: Control<z.infer<typeof FormSchema>>;
  }) {
    const materialCost = useWatch({ control, name: "material" });
    const total = getTotal(materialCost);
    return <span>₱{total.toFixed(2)}</span>;
  }

  const adjustForTimezone = (date: Date) => {
    const offset = date.getTimezoneOffset();
    return offset > 0 ? subMinutes(date, offset) : addMinutes(date, Math.abs(offset));
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log("Form Submitted:", data);

    const adjustedDate = adjustForTimezone(data.date);

    const eventDataWithUser = {
      ...data,
      date: adjustedDate,
      username: user?.user_metadata?.username,
    };

    console.log("event data with username", eventDataWithUser)

    toast({
      title: "Successfully added event",
      description: `${data.name} has been saved`,
    });

    const insertEvent = async () => {
      const { data: eventData, error } = await supabase
        .from("event")
        .insert(eventDataWithUser)
        .single();

        if (error) {
          console.log("Error adding event: ", error);
        } else {
          console.log("Added event", eventData) 
        }
    }

    insertEvent();
  }

  return (
    <div className="container mx-auto rounded">
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 max-w-3xl mx-auto"
            >
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Event Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Event Address" {...field} />
                    </FormControl>
                    <FormMessage />
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
                          disabled={(date) => date < new Date()}
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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event type" />
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
              <p>{errors.material?.message}</p>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Cost:</span>
                  <span className="text-2xl font-bold">
                    <TotalAmount control={control} />
                  </span>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button type="submit">Submit</Button>
                <Button type="button">
                  <FileDown className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </form>
          </Form>
    </div>
  );
}
