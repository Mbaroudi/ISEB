"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, X, Eye, EyeOff } from "lucide-react";

interface MessageFormProps {
  onSubmit: (data: MessageFormData) => Promise<void>;
  isAccountant?: boolean;
  placeholder?: string;
}

export interface MessageFormData {
  content: string;
  is_internal: boolean;
  attachments?: File[];
}

export default function MessageForm({
  onSubmit,
  isAccountant = false,
  placeholder = "Tapez votre message...",
}: MessageFormProps) {
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && attachments.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        is_internal: isInternal,
        attachments,
      });

      // Reset form
      setContent("");
      setIsInternal(false);
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error submitting message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Internal toggle (for accountants only) */}
      {isAccountant && (
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsInternal(!isInternal)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isInternal
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {isInternal ? (
              <>
                <EyeOff className="h-4 w-4" />
                Message interne
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Message public
              </>
            )}
          </button>
          {isInternal && (
            <p className="text-xs text-purple-600">
              Visible uniquement par l'équipe comptable
            </p>
          )}
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-gray-500">
          Astuce : Ctrl+Entrée pour envoyer
        </p>
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        {/* Left side - Attachments */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="message-file-input"
          />
          <label
            htmlFor="message-file-input"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
          >
            <Paperclip className="h-4 w-4" />
            Joindre fichier
          </label>
        </div>

        {/* Right side - Submit */}
        <button
          type="submit"
          disabled={isSubmitting || (!content.trim() && attachments.length === 0)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Envoi..." : "Envoyer"}
        </button>
      </div>
    </form>
  );
}
