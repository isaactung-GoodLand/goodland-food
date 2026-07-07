import { Pool } from '@neondatabase/serverless';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export interface Restaurant {
  id: number;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  facebook: string;
  instagram: string;
  line: string;
  rating: number | null;
  gmaps_url: string;
  has_hongkong_milk_tea: boolean;
}

export interface ContactLog {
  id: number;
  restaurant_id: number;
  contact_date: string;
  contact_type: string;
  notes: string;
  created_at: string;
}
