import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/helper/supabaseClient';
import { Link, useNavigate } from 'react-router';

const FormSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    message: z.string()
})

export default function Login() {

    const { toast } = useToast();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: "",
            password: "",
            message: ""
        }
    })

    const navigate = useNavigate();

    const { control, handleSubmit, reset } = form;

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        const { email, password } = data;
      
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
      
          if (error) {
            console.error("Authentication error:", error.message);
            toast({
              title: "Login Failed",
              description: error.message,
            });
            return; 
          }
      
          console.log(`Successfully logged in user ${email}`);
          toast({
            title: "Successfully Logged In",
            description: `${email} has been logged in.`,
          });
      
          reset();
          navigate("/");
        } catch (err) {
          console.error("Unexpected error:", err);
          toast({
            title: "Unexpected Error",
            description: "Something went wrong. Please try again.",
          });
        }
    }
      

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className='text-2xl'>Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='flex flex-col gap-6'>
                            <div className='grid gap-2'>
                                <FormField 
                                control={control}
                                name='email'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input 
                                            id='email'
                                            type='email'
                                            placeholder='m@example.com'
                                            {...field}
                                            required
                                            />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <div className='grid gap-2'>
                            <FormField 
                                control={control}
                                name='password'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input 
                                            id='password'
                                            type='password'
                                            placeholder='Password'
                                            {...field}
                                            required
                                            />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <Button type='submit' className='w-full rounded'>
                                Login
                            </Button>
                        </div>
                        <div className='mt-4 text-center text-sm'>
                            Don't have an account?{" "}
                            <Link to="/register" className="underline underline-offset-4">Register</Link>
                        </div>
                    </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
