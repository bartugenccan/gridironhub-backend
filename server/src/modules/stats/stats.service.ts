import { supabaseAdmin } from '../../lib/supabase';
import { badRequest, notFound } from '../../utils/http-error';
import type {
  CreateStrengthLogDTO,
  PersonalRecord,
  StrengthLog,
  CreatePrRequestDTO,
  PrRequest,
  PrRequestStatus,
  UpdatePrRequestStatusDTO,
} from './stats.types';
import { deleteFile } from '../../lib/storage';

export const getPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  const { data, error } = await supabaseAdmin
    .from('strength_logs')
    .select('*')
    .eq('user_id', userId)
    .order('one_rep_max', { ascending: false });

  if (error) {
    throw badRequest(`Failed to fetch strength logs: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Group by lift_name and take the first one (which is the max because of ordering)
  const recordsMap = new Map<string, StrengthLog>();

  (data as unknown as StrengthLog[]).forEach((log) => {
    if (!recordsMap.has(log.lift_name)) {
      recordsMap.set(log.lift_name, log);
    }
  });

  return Array.from(recordsMap.values()).map((log) => ({
    id: log.id,
    liftName: log.lift_name,
    oneRepMax: Number(log.one_rep_max),
    recordedAt: log.recorded_at,
  }));
};

export const addStrengthLog = async (
  userId: string,
  data: CreateStrengthLogDTO,
): Promise<StrengthLog> => {
  const { data: newLog, error } = await supabaseAdmin
    .from('strength_logs')
    .insert({
      user_id: userId,
      lift_name: data.liftName,
      one_rep_max: data.oneRepMax,
      recorded_at: data.recordedAt || new Date().toISOString(),
      notes: data.notes,
    })
    .select()
    .single();

  if (error) {
    throw badRequest(`Failed to add strength log: ${error.message}`);
  }

  return newLog as unknown as StrengthLog;
};

export const getLiftHistory = async (userId: string, liftName: string): Promise<StrengthLog[]> => {
  const { data, error } = await supabaseAdmin
    .from('strength_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('lift_name', liftName)
    .order('recorded_at', { ascending: true });

  if (error) {
    throw badRequest(`Failed to fetch lift history: ${error.message}`);
  }

  return (data || []) as unknown as StrengthLog[];
};

export const deleteStrengthLog = async (userId: string, logId: string): Promise<void> => {
  // First check if the log exists and belongs to the user
  const { data: existingLog, error: fetchError } = await supabaseAdmin
    .from('strength_logs')
    .select('id')
    .eq('id', logId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existingLog) {
    throw badRequest('Log not found or access denied');
  }

  const { error } = await supabaseAdmin.from('strength_logs').delete().eq('id', logId);

  if (error) {
    throw badRequest(`Failed to delete strength log: ${error.message}`);
  }
};

// PR Requests

export const createPrRequest = async (
  userId: string,
  data: CreatePrRequestDTO,
): Promise<PrRequest> => {
  const { data: newRequest, error } = await supabaseAdmin
    .from('pr_requests')
    .insert({
      user_id: userId,
      lift_name: data.liftName,
      value: data.value,
      video_url: data.videoUrl,
      strength_log_id: data.strengthLogId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw badRequest(`Failed to create PR request: ${error.message}`);
  }

  return newRequest as unknown as PrRequest;
};

export const getPendingPrRequests = async (): Promise<PrRequest[]> => {
  // Join with player profiles to get names
  const { data, error } = await supabaseAdmin
    .from('pr_requests')
    .select(
      `
      *,
      user:player_profiles(full_name)
    `,
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw badRequest(`Failed to fetch pending PR requests: ${error.message}`);
  }

  return data.map((req: any) => ({
    ...req,
    player_name: req.user?.full_name || 'Unknown Player',
  })) as unknown as PrRequest[];
};

export const updatePrRequestStatus = async (
  requestId: string,
  data: UpdatePrRequestStatusDTO,
): Promise<PrRequest> => {
  // 1. Fetch the request
  const { data: request, error: fetchError } = await supabaseAdmin
    .from('pr_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw notFound('PR Request not found');
  }

  if (request.status !== 'pending') {
    throw badRequest('Request is already processed');
  }

  // 2. If approved, add to strength_logs (or update existing)
  if (data.status === 'approved') {
    if (request.strength_log_id) {
      // Update existing log
      const { error: logUpdateError } = await supabaseAdmin
        .from('strength_logs')
        .update({
          one_rep_max: request.value,
          notes: `Updated via PR Request. Coach notes: ${data.coachNotes || 'None'}`,
          // We don't update recorded_at to keep original date, or maybe we should?
          // Keeping original date seems correct for correcting a typo.
        })
        .eq('id', request.strength_log_id);

      if (logUpdateError) {
        throw badRequest(`Failed to update strength log: ${logUpdateError.message}`);
      }
    } else {
      // Create new log (existing behavior)
      await addStrengthLog(request.user_id, {
        liftName: request.lift_name,
        oneRepMax: request.value,
        recordedAt: new Date().toISOString(),
        notes: `Approved PR Request. Coach notes: ${data.coachNotes || 'None'}`,
      });
    }
  }

  // 3. Delete video if it exists (for both approved and rejected)
  if (request.video_url) {
    try {
      // Extract file path from public URL
      // URL Format: .../storage/v1/object/public/pr-videos/USER_ID/FILENAME
      const urlParts = request.video_url.split('/pr-videos/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        try {
          await deleteFile('pr-videos', filePath);
        } catch (err) {
          console.error('Failed to delete PR video:', err);
          // Non-critical error
        }
      }
    } catch (err) {
      console.error('Error processing video deletion:', err);
    }
  }

  // 4. Update request status
  const { data: updatedRequest, error: updateError } = await supabaseAdmin
    .from('pr_requests')
    .update({
      status: data.status,
      coach_notes: data.coachNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (updateError) {
    throw badRequest(`Failed to update request status: ${updateError.message}`);
  }

  return updatedRequest as unknown as PrRequest;
};
