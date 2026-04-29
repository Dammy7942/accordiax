import { supabase } from '@/lib/supabaseClient'

export default async function Home() {
  const { data, error } = await supabase.from('profiles').select('*')
  console.log('profiles:', data, error)
  return <div>Accordiax – check console</div>
}