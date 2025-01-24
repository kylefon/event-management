import supabase from "@/helper/supabaseClient";
import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router";

interface WrapperProps {
    children: ReactNode;
}

function PrivateWrapper({ children }: WrapperProps){
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const  {
                data: { session },
            } = await supabase.auth.getSession();
            setAuthenticated(!!session);
            setLoading(false);
        }

        getSession();
    }, [])

    if (loading) {
        return <div>Loading...</div>
    } else {
        if (authenticated) {
            return <>{children}</>
        }

        return <Navigate to="/login" />
    }
}

export default PrivateWrapper