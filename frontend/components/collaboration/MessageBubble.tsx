import { User, Clock, CheckCircle, Paperclip } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  message: {
    id: number;
    user_id: [number, string];
    author_name?: string;
    content: string;
    attachment_ids: any[];
    create_date: string;
    is_internal: boolean;
    is_solution: boolean;
  };
  isCurrentUser: boolean;
  onMarkAsSolution?: (messageId: number) => void;
  canMarkSolution?: boolean;
}

export default function MessageBubble({
  message,
  isCurrentUser,
  onMarkAsSolution,
  canMarkSolution = false,
}: MessageBubbleProps) {
  const [isMarking, setIsMarking] = useState(false);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "À l'instant";
    if (diffSeconds < 3600) return `Il y a ${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400) return `Il y a ${Math.floor(diffSeconds / 3600)}h`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);

    if (messageDate.getTime() === today.getTime()) {
      return `Aujourd'hui à ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return `Hier à ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleMarkAsSolution = async () => {
    if (!onMarkAsSolution) return;
    setIsMarking(true);
    try {
      await onMarkAsSolution(message.id);
    } finally {
      setIsMarking(false);
    }
  };

  const authorName = message.author_name || message.user_id[1];
  const hasAttachments = message.attachment_ids && message.attachment_ids.length > 0;

  return (
    <div
      className={`flex gap-3 mb-4 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
            isCurrentUser
              ? "bg-blue-500"
              : message.is_internal
              ? "bg-purple-500"
              : "bg-gray-500"
          }`}
        >
          {authorName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"}`}>
        {/* Author and time */}
        <div
          className={`flex items-center gap-2 mb-1 text-sm ${
            isCurrentUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="font-semibold text-gray-900">{authorName}</span>
          {message.is_internal && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              Interne
            </span>
          )}
          {message.is_solution && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Solution
            </span>
          )}
          <span className="text-gray-500 text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(message.create_date)}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-3 ${
            isCurrentUser
              ? "bg-blue-500 text-white"
              : message.is_internal
              ? "bg-purple-50 border border-purple-200"
              : "bg-gray-100"
          }`}
        >
          {/* Content */}
          <div
            className={`prose prose-sm max-w-none ${
              isCurrentUser ? "prose-invert" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: message.content }}
          />

          {/* Attachments */}
          {hasAttachments && (
            <div className="mt-3 pt-3 border-t border-opacity-20 space-y-2">
              {message.attachment_ids.map((attachment: any, index: number) => (
                <a
                  key={attachment.id || index}
                  href={`/api/attachments/${attachment.id}`}
                  download
                  className={`flex items-center gap-2 text-sm hover:underline ${
                    isCurrentUser ? "text-blue-100" : "text-blue-600"
                  }`}
                >
                  <Paperclip className="h-4 w-4" />
                  <span>{attachment.name || `Pièce jointe ${index + 1}`}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Mark as solution button */}
        {canMarkSolution && !message.is_solution && !isCurrentUser && (
          <button
            onClick={handleMarkAsSolution}
            disabled={isMarking}
            className="mt-2 text-xs text-gray-500 hover:text-green-600 flex items-center gap-1 disabled:opacity-50"
          >
            <CheckCircle className="h-3 w-3" />
            {isMarking ? "Marquage..." : "Marquer comme solution"}
          </button>
        )}
      </div>
    </div>
  );
}
