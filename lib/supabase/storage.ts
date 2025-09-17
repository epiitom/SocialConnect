import { supabase } from './client';

export class SupabaseStorage {
  private bucket = 'uploads';

  async uploadFile(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Delete existing avatar if it exists
    try {
      await this.deleteFile(filePath);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Ignore error if file doesn't exist
    }

    return this.uploadFile(file, filePath);
  }

  async uploadPostImage(file: File, postId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${postId}_${Date.now()}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    return this.uploadFile(file, filePath);
  }
}

export const storage = new SupabaseStorage();