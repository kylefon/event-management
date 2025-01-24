import supabase from "@/helper/supabaseClient";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
    id: string; 
    email: string;
    user_metadata: {
        username: string;
    }
}

const UserContext = createContext();

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
                } else {
                    setUser(data.user as User);
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