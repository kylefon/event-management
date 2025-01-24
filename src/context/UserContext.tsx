import supabase from "@/helper/supabaseClient";
import { createContext, useContext, useEffect, useState } from "react";
import { z } from "zod";


export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    user_metadata: z.object({
        username: z.string(),
    }),
});

export type User = z.infer<typeof UserSchema>;

const UserContext = createContext<User | null>(null);

export const useUserContext = () => {
    return useContext(UserContext);
} 

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error || !data?.user) {
                    console.error("Error fetching user: ", error);
                    setUser(null);
                    return;
                }

                try {
                    const validatedUser = UserSchema.parse(data.user);
                    setUser(validatedUser);
                } catch (validationError) {
                    console.error("Validation error: ", validationError);
                    setUser(null);
                }
                
            } catch (err) {
                console.error("Unexpected error: ", err);
                setUser(null);
            }
        };

        fetchUser();
    }, [])

    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>
    )
}