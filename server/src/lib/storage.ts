import { supabaseAdmin } from './supabase';

export const uploadFile = async (
  bucket: string,
  path: string,
  file: Express.Multer.File,
): Promise<string> => {
  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  return publicUrlData.publicUrl;
};

export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  const { error: deleteError } = await supabaseAdmin.storage.from(bucket).remove([path]);

  if (deleteError) {
    throw new Error(`Failed to delete file: ${deleteError.message}`);
  }
};
