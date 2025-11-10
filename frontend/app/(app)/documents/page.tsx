"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useDocuments, useUploadDocument } from "@/lib/odoo/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Upload,
  Search,
  Download,
  Eye,
  Trash2,
  Filter,
  Grid3x3,
  List,
  Tag as TagIcon,
  Archive,
  FolderOpen,
  Calendar,
  DollarSign,
  X,
  Check,
  Plus,
  ChevronDown,
  Image as ImageIcon,
  FileCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Document {
  id: number;
  name: string;
  reference: string;
  document_type: string;
  category_id: [number, string] | false;
  tag_ids: [[number[]], string[]];
  document_date: string;
  amount_total: number;
  currency_id: [number, string];
  supplier_id: [number, string] | false;
  upload_date: string;
  state: string;
  is_expired: boolean;
  active: boolean;
  download_count: number;
  view_count: number;
  filename: string;
  file_size: number;
}

interface Tag {
  id: number;
  name: string;
  color: number;
}

interface Category {
  id: number;
  name: string;
  complete_name: string;
  parent_id: [number, string] | false;
  document_count: number;
}

const TAG_COLORS = [
  "bg-gray-100 text-gray-800",
  "bg-red-100 text-red-800",
  "bg-orange-100 text-orange-800",
  "bg-yellow-100 text-yellow-800",
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-cyan-100 text-cyan-800",
  "bg-gray-100 text-gray-600",
  "bg-indigo-100 text-indigo-800",
  "bg-green-100 text-green-800",
  "bg-teal-100 text-teal-800",
];

export default function DocumentsPage() {
  // State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocument = useUploadDocument();

  // Load tags and categories
  useEffect(() => {
    loadTags();
    loadCategories();
  }, []);

  // Load documents when filters change
  useEffect(() => {
    searchDocuments();
  }, [
    searchQuery,
    filterType,
    selectedCategory,
    selectedTags,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    selectedState,
    showArchived,
  ]);

  const loadTags = async () => {
    try {
      const response = await fetch("/api/documents/tags");
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/documents/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const searchDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const response = await fetch("/api/documents/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search_term: searchQuery || undefined,
          document_type: filterType !== "all" ? filterType : undefined,
          category_id: selectedCategory || undefined,
          tag_ids: selectedTags.length > 0 ? selectedTags : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          amount_min: amountMin ? parseFloat(amountMin) : undefined,
          amount_max: amountMax ? parseFloat(amountMax) : undefined,
          state: selectedState !== "all" ? selectedState : undefined,
          archived: showArchived ? true : false,
        }),
      });
      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error searching documents:", error);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        await handleFileUpload(file);
      }
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const chunkSize = 0x8000;
      let binary = "";
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64Data = btoa(binary);

      const uploadData = {
        name: file.name,
        document_type: getDocumentType(file.name),
        file_data: base64Data,
        description: `Uploaded ${new Date().toLocaleString()}`,
      };

      await uploadDocument.mutateAsync(uploadData);
      alert("Document uploadé avec succès!");
      searchDocuments(); // Refresh list
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Erreur lors de l'upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const getDocumentType = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes("facture") || lower.includes("invoice")) return "invoice";
    if (lower.includes("contrat") || lower.includes("contract")) return "contract";
    if (lower.includes("reçu") || lower.includes("receipt")) return "justificatif";
    return "other";
  };

  // Document actions
  const handleViewDocument = async (doc: Document) => {
    setPreviewDocument(doc);
    setShowPreview(true);

    // Increment view count
    try {
      await fetch(`/api/documents/${doc.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "increment_view" }),
      });
    } catch (error) {
      console.error("Error incrementing view:", error);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename || doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading:", error);
      alert("Erreur lors du téléchargement");
    }
  };

  const handleDeleteDocument = async (docId: number, docName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${docName}" ?`)) {
      return;
    }

    try {
      await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });
      searchDocuments(); // Refresh
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleArchiveDocument = async (docId: number, archive: boolean) => {
    try {
      await fetch(`/api/documents/${docId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive }),
      });
      searchDocuments(); // Refresh
    } catch (error) {
      console.error("Error archiving:", error);
      alert("Erreur lors de l'archivage");
    }
  };

  const handleUpdateTags = async (docId: number, tagIds: number[]) => {
    try {
      await fetch(`/api/documents/${docId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag_ids: tagIds }),
      });
      searchDocuments(); // Refresh
    } catch (error) {
      console.error("Error updating tags:", error);
      alert("Erreur lors de la mise à jour des tags");
    }
  };

  // Bulk actions
  const handleSelectDocument = (docId: number) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map((doc) => doc.id));
    }
  };

  const handleBulkArchive = async () => {
    for (const docId of selectedDocuments) {
      await handleArchiveDocument(docId, true);
    }
    setSelectedDocuments([]);
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Supprimer ${selectedDocuments.length} document(s) sélectionné(s) ?`
      )
    ) {
      return;
    }

    for (const docId of selectedDocuments) {
      const doc = documents.find((d) => d.id === docId);
      if (doc) {
        await handleDeleteDocument(docId, doc.name);
      }
    }
    setSelectedDocuments([]);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setSelectedCategory(null);
    setSelectedTags([]);
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setSelectedState("all");
    setShowArchived(false);
  };

  const activeFilterCount = [
    searchQuery,
    filterType !== "all",
    selectedCategory,
    selectedTags.length > 0,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    selectedState !== "all",
    showArchived,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos factures, contrats et justificatifs
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Upload en cours..." : "Uploader"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtres
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="invoice">Factures</SelectItem>
                  <SelectItem value="contract">Contrats</SelectItem>
                  <SelectItem value="justificatif">Justificatifs</SelectItem>
                  <SelectItem value="other">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Catégorie</label>
              <Select
                value={selectedCategory?.toString() || "all"}
                onValueChange={(v) =>
                  setSelectedCategory(v === "all" ? null : parseInt(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.complete_name} ({cat.document_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>
                      {selectedTags.length > 0
                        ? `${selectedTags.length} sélectionné(s)`
                        : "Aucun"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag.id}
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTags([...selectedTags, tag.id]);
                        } else {
                          setSelectedTags(
                            selectedTags.filter((id) => id !== tag.id)
                          );
                        }
                      }}
                    >
                      <Badge className={TAG_COLORS[tag.color % TAG_COLORS.length]}>
                        {tag.name}
                      </Badge>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">État</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date début</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date fin</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Montant min
              </label>
              <Input
                type="number"
                placeholder="0"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Montant max
              </label>
              <Input
                type="number"
                placeholder="10000"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Afficher archivés</span>
              </label>
            </div>

            <div className="flex items-end">
              <Button variant="ghost" onClick={clearFilters} className="w-full">
                <X className="mr-2 h-4 w-4" />
                Effacer filtres
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedDocuments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">
              {selectedDocuments.length} document(s) sélectionné(s)
            </span>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Tout sélectionner
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archiver
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      {/* Drag & drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Glissez-déposez vos fichiers ici ou{" "}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:underline"
          >
            parcourez
          </button>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF et images acceptés (max 10MB)
        </p>
      </div>

      {/* Documents grid/list */}
      {isLoadingDocuments ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Chargement...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600">Aucun document trouvé</p>
          <p className="text-sm text-gray-500">
            Essayez de modifier vos filtres ou uploadez un nouveau document
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              tags={tags}
              isSelected={selectedDocuments.includes(doc.id)}
              onSelect={() => handleSelectDocument(doc.id)}
              onView={() => handleViewDocument(doc)}
              onDownload={() => handleDownloadDocument(doc)}
              onDelete={() => handleDeleteDocument(doc.id, doc.name)}
              onArchive={() => handleArchiveDocument(doc.id, !doc.active)}
              onUpdateTags={(tagIds) => handleUpdateTags(doc.id, tagIds)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedDocuments.length === documents.length &&
                      documents.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  État
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  tags={tags}
                  isSelected={selectedDocuments.includes(doc.id)}
                  onSelect={() => handleSelectDocument(doc.id)}
                  onView={() => handleViewDocument(doc)}
                  onDownload={() => handleDownloadDocument(doc)}
                  onDelete={() => handleDeleteDocument(doc.id, doc.name)}
                  onArchive={() => handleArchiveDocument(doc.id, !doc.active)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview modal */}
      <PreviewModal
        document={previewDocument}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onDownload={() =>
          previewDocument && handleDownloadDocument(previewDocument)
        }
      />
    </div>
  );
}

// Document Card Component (Grid view)
function DocumentCard({
  document: doc,
  tags,
  isSelected,
  onSelect,
  onView,
  onDownload,
  onDelete,
  onArchive,
  onUpdateTags,
}: {
  document: Document;
  tags: Tag[];
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onUpdateTags: (tagIds: number[]) => void;
}) {
  const documentTags = doc.tag_ids && doc.tag_ids[0] ? doc.tag_ids[0] : [];
  const docTagObjects = tags.filter((tag) => documentTags.includes(tag.id));

  const isPdf = doc.filename?.toLowerCase().endsWith(".pdf");
  const isImage =
    doc.filename?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) !== null;

  return (
    <div
      className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
        isSelected ? "ring-2 ring-blue-500" : ""
      } ${!doc.active ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded mt-1"
        />
        <div className="flex-1 ml-3">
          <div className="flex items-center gap-2">
            {isPdf ? (
              <FileText className="h-5 w-5 text-red-600" />
            ) : isImage ? (
              <ImageIcon className="h-5 w-5 text-blue-600" />
            ) : (
              <FileCheck className="h-5 w-5 text-gray-600" />
            )}
            <h3
              className="font-medium text-sm truncate cursor-pointer hover:text-blue-600"
              onClick={onView}
            >
              {doc.name}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">{doc.reference}</p>
        </div>
      </div>

      <div className="space-y-2">
        {doc.document_date && (
          <div className="flex items-center text-xs text-gray-600">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(doc.document_date).toLocaleDateString("fr-FR")}
          </div>
        )}

        {doc.amount_total > 0 && (
          <div className="flex items-center text-xs text-gray-600">
            <DollarSign className="h-3 w-3 mr-1" />
            {doc.amount_total.toFixed(2)} {doc.currency_id[1]}
          </div>
        )}

        {doc.category_id && (
          <div className="flex items-center text-xs text-gray-600">
            <FolderOpen className="h-3 w-3 mr-1" />
            <span className="truncate">{doc.category_id[1]}</span>
          </div>
        )}

        {docTagObjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {docTagObjects.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                className={`text-xs ${TAG_COLORS[tag.color % TAG_COLORS.length]}`}
              >
                {tag.name}
              </Badge>
            ))}
            {docTagObjects.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{docTagObjects.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onView}
            title="Voir"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDownload}
            title="Télécharger"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onArchive}
            title={doc.active ? "Archiver" : "Désarchiver"}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onDelete}
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// Document Row Component (List view)
function DocumentRow({
  document: doc,
  tags,
  isSelected,
  onSelect,
  onView,
  onDownload,
  onDelete,
  onArchive,
}: {
  document: Document;
  tags: Tag[];
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onArchive: () => void;
}) {
  const documentTags = doc.tag_ids && doc.tag_ids[0] ? doc.tag_ids[0] : [];
  const docTagObjects = tags.filter((tag) => documentTags.includes(tag.id));

  const typeLabels: Record<string, string> = {
    invoice: "Facture",
    contract: "Contrat",
    justificatif: "Justificatif",
    other: "Autre",
  };

  const stateLabels: Record<string, string> = {
    draft: "Brouillon",
    pending: "En attente",
    validated: "Validé",
    rejected: "Rejeté",
  };

  const stateColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    validated: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <tr className={`hover:bg-gray-50 ${!doc.active ? "opacity-60" : ""}`}>
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded"
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <div
              className="font-medium text-sm cursor-pointer hover:text-blue-600"
              onClick={onView}
            >
              {doc.name}
            </div>
            <div className="text-xs text-gray-500">{doc.reference}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        {typeLabels[doc.document_type] || doc.document_type}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {doc.document_date
          ? new Date(doc.document_date).toLocaleDateString("fr-FR")
          : "-"}
      </td>
      <td className="px-6 py-4 text-sm">
        {doc.amount_total > 0
          ? `${doc.amount_total.toFixed(2)} ${doc.currency_id[1]}`
          : "-"}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {docTagObjects.slice(0, 2).map((tag) => (
            <Badge
              key={tag.id}
              className={`text-xs ${TAG_COLORS[tag.color % TAG_COLORS.length]}`}
            >
              {tag.name}
            </Badge>
          ))}
          {docTagObjects.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{docTagObjects.length - 2}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge className={stateColors[doc.state]}>
          {stateLabels[doc.state] || doc.state}
        </Badge>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onView}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onArchive}
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// Preview Modal Component
function PreviewModal({
  document: doc,
  isOpen,
  onClose,
  onDownload,
}: {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && doc) {
      loadPreview();
    } else {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
  }, [isOpen, doc]);

  const loadPreview = async () => {
    if (!doc) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${doc.id}`);
      const docData = await response.json();

      if (docData.file_data) {
        const byteCharacters = atob(docData.file_data);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }

        let mimeType = "application/octet-stream";
        if (doc.filename?.toLowerCase().endsWith(".pdf")) {
          mimeType = "application/pdf";
        } else if (doc.filename?.toLowerCase().match(/\.(jpg|jpeg)$/)) {
          mimeType = "image/jpeg";
        } else if (doc.filename?.toLowerCase().endsWith(".png")) {
          mimeType = "image/png";
        }

        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error("Error loading preview:", error);
      alert("Erreur lors du chargement de la prévisualisation");
    } finally {
      setIsLoading(false);
    }
  };

  if (!doc) return null;

  const isPdf = doc.filename?.toLowerCase().endsWith(".pdf");
  const isImage = doc.filename?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{doc.name}</DialogTitle>
          <DialogDescription>
            {doc.reference} • {doc.document_type}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : previewUrl ? (
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              {isPdf ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[600px]"
                  title="PDF Preview"
                />
              ) : isImage ? (
                <img
                  src={previewUrl}
                  alt={doc.name}
                  className="max-w-full max-h-[600px] mx-auto"
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>Prévisualisation non disponible pour ce type de fichier</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              Erreur de chargement
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-gray-500">
            <p>Taille: {(doc.file_size / 1024).toFixed(2)} KB</p>
            <p>Vues: {doc.view_count} • Téléchargements: {doc.download_count}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
