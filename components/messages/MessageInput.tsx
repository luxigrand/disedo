'use client';

import { useState, KeyboardEvent, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Paperclip, X } from 'lucide-react';

interface MessageInputProps {
  channelId: string;
  onMessageSent?: () => void;
}

export default function MessageInput({ channelId, onMessageSent }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || sending || uploading) return;

    setSending(true);
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload attachments
      const attachmentUrls: string[] = [];
      for (const file of attachments) {
        try {
          const url = await uploadFile(file);
          attachmentUrls.push(url);
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }

      const { error } = await supabase.from('messages').insert({
        channel_id: channelId,
        user_id: user.id,
        content: content.trim() || '',
        attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
      });

      if (error) throw error;

      setContent('');
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-700">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 bg-gray-700 rounded px-2 py-1 text-sm"
            >
              <span className="text-gray-300 truncate max-w-xs">{file.name}</span>
              <button
                onClick={() => handleRemoveAttachment(index)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end space-x-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <div className="flex-1 rounded-lg bg-gray-700 border border-gray-600 focus-within:border-gray-500">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message #channel"
            rows={1}
            className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none max-h-40"
            style={{ minHeight: '44px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={(!content.trim() && attachments.length === 0) || sending || uploading}
          className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
