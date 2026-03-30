import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bruennbzkkmerdmbvjfn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydWVubmJ6a2ttZXJkbWJ2amZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTYwMTUsImV4cCI6MjA5MDE5MjAxNX0.62uVkcaqJV_KDH7Shrb0xJlbXHuMeMXJvJY0RjalKvg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)