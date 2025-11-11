import Link from "next/link";
import { MessageCircle, Clock, User, AlertTriangle } from "lucide-react";

interface QuestionCardProps {
  question: {
    id: number;
    name: string;
    question_type: string;
    state: string;
    priority: string;
    user_id: [number, string];
    assigned_to_id?: [number, string];
    message_count: number;
    create_date: string;
    response_time_hours?: number;
  };
}

const QUESTION_TYPES: Record<string, { label: string; icon: string }> = {
  missing_document: { label: "Document manquant", icon: "📄" },
  line_clarification: { label: "Clarification ligne", icon: "❓" },
  bank_statement: { label: "Relevé bancaire", icon: "🏦" },
  vat_question: { label: "Question TVA", icon: "💶" },
  correction_request: { label: "Demande de correction", icon: "✏️" },
  general: { label: "Question générale", icon: "💬" },
};

const STATE_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-blue-100 text-blue-800",
  answered: "bg-green-100 text-green-800",
  resolved: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  "0": "bg-gray-100 text-gray-600",
  "1": "bg-blue-100 text-blue-600",
  "2": "bg-orange-100 text-orange-600",
  "3": "bg-red-100 text-red-600",
};

const PRIORITY_LABELS: Record<string, string> = {
  "0": "Basse",
  "1": "Normale",
  "2": "Haute",
  "3": "Urgente",
};

export default function QuestionCard({ question }: QuestionCardProps) {
  const typeInfo = QUESTION_TYPES[question.question_type] || QUESTION_TYPES.general;
  const stateColor = STATE_COLORS[question.state] || STATE_COLORS.draft;
  const priorityColor = PRIORITY_COLORS[question.priority] || PRIORITY_COLORS["1"];

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "il y a quelques secondes";
    if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `il y a ${Math.floor(seconds / 86400)}j`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <Link href={`/questions/${question.id}`}>
      <div className="block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{typeInfo.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {question.name}
              </h3>
              <p className="text-sm text-gray-500">{typeInfo.label}</p>
            </div>
          </div>

          {/* Priority badge */}
          {question.priority !== "1" && (
            <div className="flex items-center gap-1">
              {question.priority === "3" && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor}`}>
                {PRIORITY_LABELS[question.priority]}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4 text-gray-600">
            {/* Créé par */}
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="truncate max-w-[120px]">{question.user_id[1]}</span>
            </div>

            {/* Messages count */}
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{question.message_count}</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{timeAgo(question.create_date)}</span>
            </div>
          </div>

          {/* State badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${stateColor}`}>
            {question.state === "pending" && "En attente"}
            {question.state === "answered" && "Répondu"}
            {question.state === "resolved" && "Résolu"}
            {question.state === "closed" && "Fermé"}
            {question.state === "draft" && "Brouillon"}
          </span>
        </div>

        {/* Assigned to */}
        {question.assigned_to_id && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Assigné à <strong>{question.assigned_to_id[1]}</strong>
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
