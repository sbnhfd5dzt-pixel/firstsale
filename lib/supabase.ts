import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajoghqvtgbfwgeluogcl.supabase.co';
const supabaseAnonKey = 'sb_publishable_mQhUO1B_cxHrG2Xexhv0Zw_MgsQYPuQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);