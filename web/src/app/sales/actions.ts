'use server';

import { redirect } from 'next/navigation';
import { requireSalesAccess } from '@/lib/sales-guard';
import { todayBusiness, validateParty, validWeekStart, type PartyInput } from '@/lib/parties';

const ID = /^\d+$/;

function back(week: string, message: string): never {
  redirect(`/sales/parties?week=${encodeURIComponent(week)}&msg=${encodeURIComponent(message)}`);
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function readInput(formData: FormData): PartyInput {
  return {
    date: field(formData, 'date'),
    startTime: field(formData, 'start_time'),
    endTime: field(formData, 'end_time'),
    kids: field(formData, 'kids'),
    partyType: field(formData, 'party_type'),
    customerName: field(formData, 'customer_name'),
    notes: field(formData, 'notes'),
  };
}

// Sales can create and edit parties. They can't set assigned_host or the lock:
// the database trigger rejects those changes, and the form doesn't send them.
export async function createParty(formData: FormData) {
  const { supabase, user } = await requireSalesAccess();
  const input = readInput(formData);
  const parsed = validateParty(input);
  const week = validWeekStart(input.date, todayBusiness());
  if (!parsed.ok) back(week, parsed.error);
  const v = parsed.value;

  const { error } = await supabase.from('parties').insert({
    party_date: v.partyDate,
    start_time: v.startTime,
    end_time: v.endTime,
    kids_count: v.kidsCount,
    party_type: v.partyType,
    customer_name: v.customerName,
    notes: v.notes,
    created_by: user.id,
  });
  if (error) back(week, 'Could not save that party.');
  back(week, 'Party added.');
}

export async function updateParty(formData: FormData) {
  const { supabase } = await requireSalesAccess();
  const id = field(formData, 'id');
  const input = readInput(formData);
  const week = validWeekStart(input.date, todayBusiness());
  if (!ID.test(id)) back(week, 'Unknown party.');

  const parsed = validateParty(input);
  if (!parsed.ok) back(week, parsed.error);
  const v = parsed.value;

  const { data, error } = await supabase
    .from('parties')
    .update({
      party_date: v.partyDate,
      start_time: v.startTime,
      end_time: v.endTime,
      kids_count: v.kidsCount,
      party_type: v.partyType,
      customer_name: v.customerName,
      notes: v.notes,
    })
    .eq('id', Number(id))
    .select('id');
  if (error) {
    // The database refuses to move an assigned or locked party for non-managers. Say so plainly.
    if (error.code === '42501' && error.message.includes('date or time of an assigned party')) {
      back(week, 'This party already has a host, so only a manager can change its date or time. Ask a manager to move it.');
    }
    back(week, 'Could not save that change.');
  }
  if (!data || data.length === 0) back(week, 'That party was not found.');
  back(week, 'Party saved.');
}

// Cancel, never delete. Parties stay on record for the fairness history.
export async function cancelParty(formData: FormData) {
  const { supabase } = await requireSalesAccess();
  const id = field(formData, 'id');
  const week = validWeekStart(field(formData, 'week'), todayBusiness());
  if (!ID.test(id)) back(week, 'Unknown party.');

  const { data, error } = await supabase
    .from('parties')
    .update({ status: 'cancelled' })
    .eq('id', Number(id))
    .select('id');
  if (error) back(week, 'Could not cancel that party.');
  if (!data || data.length === 0) back(week, 'That party was not found.');
  back(week, 'Party cancelled.');
}
