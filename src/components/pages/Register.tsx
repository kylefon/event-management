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
    username: z.string()
})

export default function Register() {

    const { toast } = useToast();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: "",
            password: "",
            username: ""
        }
    })

    const navigate = useNavigate();

    const { control, handleSubmit, reset } = form;

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        try {
          const { email, password, username } = data;
    
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                }
            }
          });
    
          if (error) {
            console.log("Error", error);
            toast({
                title: "Error registering account",
                description: `${error}`,
              });
            return;
          }

          console.log(`Successfully added user ${email}`)
    
          toast({
            title: 'Successfully registered account',
            description: `${email} has been registered.`,
          });

          reset();

          navigate("/");
          
        } catch (error) {
          console.error("An unexpected error occurred:", error);
          toast({
            title: 'Error',
            description: 'An unexpected error occurred. Please try again later.',
          });
        }
      }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className='text-2xl'>Register</CardTitle>
                    <CardDescription>
                        Enter your email below to register your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='flex flex-col gap-6'>
                            <div className='grid gap-2'>
                                <FormField 
                                control={control}
                                name='username'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input 
                                            id='username'
                                            type='text'
                                            placeholder='Username'
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
                                Create Account
                            </Button>
                        </div>
                        <div className='mt-4 text-center text-sm'>
                            Already have an account?{" "}
                            <Link to="/login" className="underline underline-offset-4">Log in</Link>
                        </div>
                    </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
