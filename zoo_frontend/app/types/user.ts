export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    created_at?: string;
    isAdmin?: boolean;
    isBlocked?: boolean;
}

export default {}