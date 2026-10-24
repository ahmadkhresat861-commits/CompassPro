import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nuoitorotcfvqrinwrrg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2l0b3JvdGNmdnFyaW53cnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTU4NzcsImV4cCI6MjA5NjIzMTg3N30.HoH5wvQOLdTBuDlP-khLyxSmMuVUWOigFd9A-51EHCk'

export const supabase = createClient(supabaseUrl, supabaseKey)