import { supabase } from '@/integrations/supabase/client';

export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: any
): Promise<{ data: T | null; error: any }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: JSON.stringify(body),
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error invoking ${functionName}:`, error);
    return { data: null, error };
  }
}
