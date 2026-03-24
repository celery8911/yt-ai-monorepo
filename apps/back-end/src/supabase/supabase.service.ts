import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
	private client: SupabaseClient | null = null;

	getClient(): SupabaseClient | null {
		if (this.client) return this.client;
		const url = process.env.SUPABASE_URL;
		const key = process.env.SUPABASE_ANON_KEY;
		if (!url || !key) return null;
		this.client = createClient(url, key);
		return this.client;
	}
}
