// Lightweight Supabase helper without top-level await
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let sb = null;
async function getClient(){
  if(!cloudEnabled) return null;
  if(sb) return sb;
  const mod = await import('https://esm.sh/@supabase/supabase-js@2');
  sb = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return sb;
}

// --- Auth ---
export async function signIn(email){
  const client = await getClient(); if(!client) return { ok:false, error:'Cloud not enabled' };
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
  return { ok: !error, error };
}
export async function signOut(){ const client = await getClient(); if(client) await client.auth.signOut(); }
export async function currentUser(){
  const client = await getClient(); if(!client) return null;
  const { data: { user } } = await client.auth.getUser();
  return user;
}

// --- Entries ---
export async function fetchEntries(){
  const client = await getClient(); if(!client) return null;
  const { data, error } = await client.from('entries').select('*').order('updated_at', { ascending:false });
  if(error) throw error;
  return data.map(r => ({ id: r.id, ...r.data, updated_by: r.updated_by, updated_at: r.updated_at }));
}

export async function upsertEntry(entry){
  const client = await getClient(); if(!client) return null;
  const { data: { user } } = await client.auth.getUser();
  const row = { id: entry.id || undefined, data: entry, updated_by: user?.id ?? null, updated_at: new Date().toISOString() };
  const { data, error } = await client.from('entries').upsert(row).select().single();
  if(error) throw error;
  return { id: data.id, ...data.data };
}

export async function deleteEntryCloud(id){
  const client = await getClient(); if(!client) return null;
  const { error } = await client.from('entries').delete().eq('id', id);
  if(error) throw error;
  return true;
}

// No audit functions anymore (we're using inline tags)
