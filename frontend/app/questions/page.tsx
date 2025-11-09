"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Filter,
  Search,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import QuestionCard from "@/components/collaboration/QuestionCard";
import QuestionForm, {
  QuestionFormData,
} from "@/components/collaboration/QuestionForm";

interface Question {
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
}

const STATE_FILTERS = [
  { value: "all", label: "Toutes", icon: MessageSquare, count: 0 },
  { value: "pending", label: "En attente", icon: Clock, count: 0 },
  { value: "answered", label: "Répondu", icon: CheckCircle, count: 0 },
  { value: "resolved", label: "Résolu", icon: CheckCircle, count: 0 },
  { value: "closed", label: "Fermé", icon: XCircle, count: 0 },
];

const QUESTION_TYPES = [
  { value: "all", label: "Tous les types" },
  { value: "missing_document", label: "Document manquant" },
  { value: "line_clarification", label: "Clarification ligne" },
  { value: "bank_statement", label: "Relevé bancaire" },
  { value: "vat_question", label: "Question TVA" },
  { value: "correction_request", label: "Demande de correction" },
  { value: "general", label: "Question générale" },
];

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedState, setSelectedState] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignedToMe, setShowAssignedToMe] = useState(false);
  const [showMyQuestions, setShowMyQuestions] = useState(false);

  // Modal
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedState !== "all") params.append("state", selectedState);
      if (selectedType !== "all") params.append("type", selectedType);
      if (showAssignedToMe) params.append("assignedToMe", "true");

      const response = await fetch(`/api/collaboration/questions?${params}`);

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

  // Apply filters
  useEffect(() => {
    let filtered = [...questions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.name.toLowerCase().includes(query) ||
          q.user_id[1].toLowerCase().includes(query)
      );
    }

    // My questions filter (client-side)
    if (showMyQuestions) {
      // This would need current user ID from session
      // For now, we'll skip this filter
    }

    setFilteredQuestions(filtered);
  }, [questions, searchQuery, showMyQuestions]);

  // Initial fetch
  useEffect(() => {
    fetchQuestions();
  }, [selectedState, selectedType, showAssignedToMe]);

  // Update state filter counts
  const stateCounts = STATE_FILTERS.map((filter) => ({
    ...filter,
    count:
      filter.value === "all"
        ? questions.length
        : questions.filter((q) => q.state === filter.value).length,
  }));

  // Handle create question
  const handleCreateQuestion = async (data: QuestionFormData) => {
    try {
      const response = await fetch("/api/collaboration/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de la question");
      }

      const result = await response.json();

      // Refresh questions list
      await fetchQuestions();

      // Navigate to the new question
      router.push(`/questions/${result.question.id}`);
    } catch (error) {
      console.error("Error creating question:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
              <p className="mt-1 text-sm text-gray-500">
                Posez vos questions et suivez les échanges avec votre comptable
              </p>
            </div>
            <button
              onClick={() => setShowQuestionForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nouvelle question
            </button>
          </div>

          {/* State filters */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
            {stateCounts.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.value}
                  onClick={() => setSelectedState(filter.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedState === filter.value
                      ? "bg-blue-100 text-blue-700"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedState === filter.value
                        ? "bg-blue-200 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters and search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une question..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Type filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {QUESTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick filters */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showAssignedToMe}
                  onChange={(e) => setShowAssignedToMe(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Assignées à moi</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showMyQuestions}
                  onChange={(e) => setShowMyQuestions(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Mes questions</span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions list */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Erreur de chargement
                </p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune question trouvée
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || selectedState !== "all" || selectedType !== "all"
                  ? "Essayez de modifier vos filtres"
                  : "Commencez par créer votre première question"}
              </p>
              {!searchQuery && selectedState === "all" && selectedType === "all" && (
                <button
                  onClick={() => setShowQuestionForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Nouvelle question
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question form modal */}
      {showQuestionForm && (
        <QuestionForm
          onClose={() => setShowQuestionForm(false)}
          onSubmit={handleCreateQuestion}
        />
      )}
    </div>
  );
}
