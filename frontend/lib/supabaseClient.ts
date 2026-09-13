// 프론트엔드용 Supabase 클라이언트. 여기는 절대 service_role 키를 쓰면 안 됨 --
// anon(public) 키만 사용 (RLS로 보호되는 걸 전제로 하는 키라 브라우저에 노출돼도 안전함).
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabaseClient] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY가 .env.local에 없음 -- 구글 로그인 동작 안 함"
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
