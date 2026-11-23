'use server';

import { redirect } from 'next/navigation';
import { requireSalesAccess } from '@/lib/sales-guard';
import { todayBusiness, validateParty, validWeekStart, type PartyInput } from '@/lib/parties';
import { salesCodeFor, type SalesCode } from '@/lib/page-messages';

const ID = /^\d+$/;

// The banner text lives in lib/page-messages.ts; the address only carries its code.
function back(week: string, code: SalesCode): never {
  redirect(`/sales/parties?week=${encodeURIComponent(week)}&msg=${code}`);
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
  if (!parsed.ok) back(week, salesCodeFor(parsed.error));
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
  if (error) back(week, 'save_party_failed');
  back(week, 'party_added');
}

export async function updateParty(formData: FormData) {
  const { supabase } = await requireSalesAccess();
  const id = field(formData, 'id');
  const input = readInput(formData);
  const week = validWeekStart(input.date, todayBusiness());
  if (!ID.test(id)) back(week, 'unknown_party');

  const parsed = validateParty(input);
  if (!parsed.ok) back(week, salesCodeFor(parsed.error));
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
      back(week, 'assigned_locked');
    }
    back(week, 'save_change_failed');
  }
  if (!data || data.length === 0) back(week, 'party_not_found');
  back(week, 'party_saved');
}

// Cancel, never delete. Parties stay on record for the fairness history.
export async function cancelParty(formData: FormData) {
  const { supabase } = await requireSalesAccess();
  const id = field(formData, 'id');
  const week = validWeekStart(field(formData, 'week'), todayBusiness());
  if (!ID.test(id)) back(week, 'unknown_party');

  const { data, error } = await supabase
    .from('parties')
    .update({ status: 'cancelled' })
    .eq('id', Number(id))
    .select('id');
  if (error) back(week, 'cancel_failed');
  if (!data || data.length === 0) back(week, 'party_not_found');
  back(week, 'party_cancelled');
}
