export interface Animal {
    id?: number;
    name: string;
    type: string;
    breed?: string;
    sex?: "male" | "female";
    age?: number;
    description?: string;
    photo_url: string;
    owner_id?: number;
    lat?: number;
    lng?: number;
    status?: string;
    created_at?: string;
}

export interface AnimalPhoto {
    photo_url: string;
}

export default {};