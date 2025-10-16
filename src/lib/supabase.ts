import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Transaction {
  id: number;
  bank_name: string | null;
  sender: string;
  receiver: string | null;
  transfer_time: string | null;
  amount: string | null;
  txn_hash: string;
}

// Fetch all transactions
export async function getTransactions() {
  console.log("Starting fetch from Supabase...");
  console.log("Supabase URL:", supabaseUrl);

  const { data, error, status, statusText } = await supabase
    .from("transactions")
    .select("*");

  console.log("Supabase Response Status:", status, statusText);

  if (error) {
    console.error("Supabase Error Details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(
      `Supabase Error: ${error.message}${
        error.hint ? ` (Hint: ${error.hint})` : ""
      }`
    );
  }

  console.log("Data received from Supabase:", data);
  console.log("Number of records:", data?.length || 0);

  if (!data || data.length === 0) {
    console.warn("⚠️ No transactions found in database. This could mean:");
    console.warn("  1. The table is empty");
    console.warn("  2. Row Level Security (RLS) is blocking access");
    console.warn(
      "  3. Check your Supabase dashboard at https://supabase.com/dashboard/project/" +
        supabaseUrl.split("//")[1]?.split(".")[0]
    );
  }

  return data as Transaction[];
}
