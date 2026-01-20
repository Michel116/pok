
'use client';

import { UserProvider } from "@/context/user-context";

export function ClientProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            {children}
        </UserProvider>
    )
}
