"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";

interface QuestionFormProps {
  onClose: () => void;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  contextData?: {
    moveId?: number;
    documentId?: number;
    expenseNoteId?: number;
  };
}

export interface QuestionFormData {
  name: string;
  description: string;
  question_type: string;
  priority: string;
  move_id?: number;
  document_id?: number;
  expense_note_id?: number;
}

const QUESTION_TYPES = [
  { value: "missing_document", label: "Document manquant", icon: "📄" },
  { value: "line_clarification", label: "Clarification ligne", icon: "❓" },
  { value: "bank_statement", label: "Relevé bancaire", icon: "🏦" },
  { value: "vat_question", label: "Question TVA", icon: "💶" },
  { value: "correction_request", label: "Demande de correction", icon: "✏️" },
  { value: "general", label: "Question générale", icon: "💬" },
];

const PRIORITIES = [
  { value: "0", label: "Basse", color: "bg-gray-100 text-gray-700" },
  { value: "1", label: "Normale", color: "bg-blue-100 text-blue-700" },
  { value: "2", label: "Haute", color: "bg-orange-100 text-orange-700" },
  { value: "3", label: "Urgente", color: "bg-red-100 text-red-700" },
];

export default function QuestionForm({
  onClose,
  onSubmit,
  contextData,
}: QuestionFormProps) {
  const [formData, setFormData] = useState<QuestionFormData>({
    name: "",
    description: "",
    question_type: "general",
    priority: "1",
    move_id: contextData?.moveId,
    document_id: contextData?.documentId,
    expense_note_id: contextData?.expenseNoteId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le sujet est requis";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est requise";
    }

    if (!formData.question_type) {
      newErrors.question_type = "Le type de question est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setErrors({
        submit: "Une erreur est survenue lors de la création de la question",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    field: keyof QuestionFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Nouvelle question
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Subject */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sujet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Ex: Document manquant pour la facture F2024-001"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de question <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {QUESTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange("question_type", type.value)}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                    formData.question_type === type.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
            {errors.question_type && (
              <p className="mt-1 text-xs text-red-600">{errors.question_type}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priorité
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => handleChange("priority", priority.value)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.priority === priority.value
                      ? `${priority.color} ring-2 ring-offset-1 ring-blue-500`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description détaillée <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.description ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Décrivez votre question en détail..."
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Fournissez le maximum de détails pour faciliter la réponse
            </p>
          </div>

          {/* Context info */}
          {(contextData?.moveId ||
            contextData?.documentId ||
            contextData?.expenseNoteId) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Cette question sera liée automatiquement à votre document.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Création..." : "Créer la question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
