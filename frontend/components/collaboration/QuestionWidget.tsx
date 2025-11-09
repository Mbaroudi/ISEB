"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Plus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import Link from "next/link";

interface QuestionWidgetProps {
  documentId: number;
  onAskQuestion?: () => void;
}

interface Question {
  id: number;
  name: string;
  question_type: string;
  state: string;
  priority: string;
  message_count: number;
  create_date: string;
}

const STATE_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending: "bg-blue-100 text-blue-600",
  answered: "bg-green-100 text-green-600",
  resolved: "bg-purple-100 text-purple-600",
  closed: "bg-gray-100 text-gray-500",
};

const STATE_LABELS: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente",
  answered: "Répondu",
  resolved: "Résolu",
  closed: "Fermé",
};

const QUESTION_TYPES: Record<string, string> = {
  missing_document: "📄",
  line_clarification: "❓",
  bank_statement: "🏦",
  vat_question: "💶",
  correction_request: "✏️",
  general: "💬",
};

export default function QuestionWidget({ documentId, onAskQuestion }: QuestionWidgetProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    if (!isExpanded) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/collaboration/questions?document_id=${documentId}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des questions");
      }

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching questions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchQuestions();
    }
  }, [isExpanded, documentId]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const hasQuestions = questions.length > 0;
  const hasPendingQuestions = questions.some((q) => q.state === "pending");

  return (
    <div className="border-t border-gray-100 bg-gray-50">
      {/* Header button */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <MessageCircle
            className={`h-5 w-5 ${
              hasPendingQuestions ? "text-blue-600" : "text-gray-400"
            }`}
          />
          <span className="text-sm font-medium text-gray-700">
            Questions ({questions.length})
          </span>
          {hasPendingQuestions && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              En attente
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onAskQuestion && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAskQuestion();
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Poser une question
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-600 py-2">{error}</div>
          ) : hasQuestions ? (
            <div className="space-y-2">
              {questions.map((question) => {
                const stateColor =
                  STATE_COLORS[question.state] || STATE_COLORS.draft;
                const icon =
                  QUESTION_TYPES[question.question_type] ||
                  QUESTION_TYPES.general;

                return (
                  <Link
                    key={question.id}
                    href={`/questions/${question.id}`}
                    className="block p-3 bg-white rounded border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {question.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${stateColor}`}
                            >
                              {STATE_LABELS[question.state]}
                            </span>
                            <span className="text-xs text-gray-500">
                              {question.message_count} message
                              {question.message_count > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-gray-500">
              Aucune question pour ce document
            </div>
          )}
        </div>
      )}
    </div>
  );
}
