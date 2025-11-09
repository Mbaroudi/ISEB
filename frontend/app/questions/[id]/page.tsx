"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MoreVertical,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  AlertCircle,
  Loader2,
  User,
  Clock,
  AlertTriangle,
} from "lucide-react";
import MessageBubble from "@/components/collaboration/MessageBubble";
import MessageForm, {
  MessageFormData,
} from "@/components/collaboration/MessageForm";

interface QuestionDetail {
  id: number;
  name: string;
  description: string;
  question_type: string;
  state: string;
  priority: string;
  user_id: [number, string];
  assigned_to_id?: [number, string];
  partner_id?: [number, string];
  move_id?: [number, string];
  document_id?: [number, string];
  message_count: number;
  create_date: string;
  resolved_date?: string;
  closed_date?: string;
  response_time_hours?: number;
  resolution_time_hours?: number;
  messages: Message[];
}

interface Message {
  id: number;
  user_id: [number, string];
  author_name?: string;
  content: string;
  attachment_ids: any[];
  create_date: string;
  is_internal: boolean;
  is_solution: boolean;
}

const QUESTION_TYPES: Record<string, { label: string; icon: string }> = {
  missing_document: { label: "Document manquant", icon: "📄" },
  line_clarification: { label: "Clarification ligne", icon: "❓" },
  bank_statement: { label: "Relevé bancaire", icon: "🏦" },
  vat_question: { label: "Question TVA", icon: "💶" },
  correction_request: { label: "Demande de correction", icon: "✏️" },
  general: { label: "Question générale", icon: "💬" },
};

const STATE_LABELS: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente",
  answered: "Répondu",
  resolved: "Résolu",
  closed: "Fermé",
};

const STATE_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-blue-100 text-blue-800",
  answered: "bg-green-100 text-green-800",
  resolved: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-600",
};

const PRIORITY_LABELS: Record<string, string> = {
  "0": "Basse",
  "1": "Normale",
  "2": "Haute",
  "3": "Urgente",
};

const PRIORITY_COLORS: Record<string, string> = {
  "0": "bg-gray-100 text-gray-600",
  "1": "bg-blue-100 text-blue-600",
  "2": "bg-orange-100 text-orange-600",
  "3": "bg-red-100 text-red-600",
};

export default function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Fetch question
  const fetchQuestion = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/collaboration/questions/${resolvedParams.id}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Question non trouvée");
        }
        throw new Error("Erreur lors de la récupération de la question");
      }

      const data = await response.json();
      setQuestion(data.question);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching question:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
    // TODO: Fetch current user ID from session
    // setCurrentUserId(session.user.id);
  }, [resolvedParams.id]);

  // Handle post message
  const handlePostMessage = async (data: MessageFormData) => {
    try {
      // First, upload attachments if any
      let attachmentIds: number[] = [];
      if (data.attachments && data.attachments.length > 0) {
        // TODO: Implement attachment upload
        // For now, we'll skip attachments
        console.log("Attachments not yet implemented");
      }

      const response = await fetch(
        `/api/collaboration/questions/${resolvedParams.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: data.content,
            is_internal: data.is_internal,
            attachments: attachmentIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du message");
      }

      // Refresh question to get new message
      await fetchQuestion();
    } catch (error) {
      console.error("Error posting message:", error);
      throw error;
    }
  };

  // Handle mark as solution
  const handleMarkAsSolution = async (messageId: number) => {
    try {
      // TODO: Implement mark as solution API endpoint
      console.log("Mark as solution:", messageId);
      await fetchQuestion();
    } catch (error) {
      console.error("Error marking as solution:", error);
    }
  };

  // Handle question actions
  const handleAction = async (action: string) => {
    try {
      const response = await fetch(
        `/api/collaboration/questions/${resolvedParams.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur lors de l'action: ${action}`);
      }

      await fetchQuestion();
      setShowActions(false);
    } catch (error) {
      console.error("Error performing action:", error);
      alert("Une erreur est survenue");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/collaboration/questions/${resolvedParams.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      router.push("/questions");
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Une erreur est survenue lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Erreur
              </h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => router.push("/questions")}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retour aux questions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const typeInfo =
    QUESTION_TYPES[question.question_type] || QUESTION_TYPES.general;
  const stateColor = STATE_COLORS[question.state] || STATE_COLORS.draft;
  const priorityColor =
    PRIORITY_COLORS[question.priority] || PRIORITY_COLORS["1"];
  const isAccountant = false; // TODO: Get from session

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back button */}
          <button
            onClick={() => router.push("/questions")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour aux questions
          </button>

          {/* Title and actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{typeInfo.icon}</span>
                <h1 className="text-2xl font-bold text-gray-900">
                  {question.name}
                </h1>
              </div>
              <p className="text-gray-600">{typeInfo.label}</p>
            </div>

            {/* Actions menu */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {question.state === "pending" && (
                    <button
                      onClick={() => handleAction("mark_answered")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marquer comme répondu
                    </button>
                  )}
                  {(question.state === "pending" ||
                    question.state === "answered") && (
                    <button
                      onClick={() => handleAction("resolve")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Résoudre
                    </button>
                  )}
                  {question.state === "resolved" && (
                    <button
                      onClick={() => handleAction("close")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Fermer
                    </button>
                  )}
                  {(question.state === "resolved" ||
                    question.state === "closed") && (
                    <button
                      onClick={() => handleAction("reopen")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Réouvrir
                    </button>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${stateColor}`}
            >
              {STATE_LABELS[question.state]}
            </span>
            {question.priority !== "1" && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${priorityColor}`}
              >
                {question.priority === "3" && (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {PRIORITY_LABELS[question.priority]}
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Créé par {question.user_id[1]}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(question.create_date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {question.assigned_to_id && (
              <div>
                <strong>Assigné à:</strong> {question.assigned_to_id[1]}
              </div>
            )}
          </div>

          {/* Description */}
          {question.description && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">
                {question.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Discussion ({question.message_count})
        </h2>

        {question.messages && question.messages.length > 0 ? (
          <div className="space-y-2 mb-6">
            {question.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={
                  currentUserId !== null && message.user_id[0] === currentUserId
                }
                onMarkAsSolution={handleMarkAsSolution}
                canMarkSolution={isAccountant && question.state !== "closed"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun message pour le moment</p>
            <p className="text-sm mt-1">
              Soyez le premier à répondre à cette question
            </p>
          </div>
        )}

        {/* Message form */}
        {question.state !== "closed" && (
          <div className="mt-6">
            <MessageForm
              onSubmit={handlePostMessage}
              isAccountant={isAccountant}
              placeholder="Écrivez votre réponse..."
            />
          </div>
        )}

        {question.state === "closed" && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-gray-600">
              Cette question est fermée. Les nouveaux messages ne sont plus
              acceptés.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
