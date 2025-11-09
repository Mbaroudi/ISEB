"use client";

import { useState } from "react";
import { useDocuments, useUploadDocument } from "@/lib/odoo/hooks";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  Search,
  Download,
  Eye,
  Trash2,
  Filter,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const { data: documents, isLoading } = useDocuments();
  const uploadDocument = useUploadDocument();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isDragging, setIsDragging] = useState(false);

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
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1];

      await uploadDocument.mutateAsync({
        name: file.name,
        document_type: getDocumentType(file.name),
        file_data: base64Data,
        description: `Uploaded ${new Date().toLocaleString()}`,
      });
    };
    reader.readAsDataURL(file);
  };

  const getDocumentType = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "invoice";
    if (["jpg", "jpeg", "png"].includes(ext || "")) return "receipt";
    return "other";
  };

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">
            Gérez vos factures, reçus et autres documents
          </p>
        </div>
        <Button variant="gradient" size="lg">
          <Upload className="mr-2 h-5 w-5" />
          Importer
        </Button>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-purple-500 bg-purple-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Glissez-déposez vos fichiers ici
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          ou cliquez pour parcourir
        </p>
        <p className="mt-1 text-xs text-gray-400">
          PDF, JPG, PNG jusqu'à 10MB
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            files.forEach(handleFileUpload);
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Tous les types</option>
            <option value="invoice">Factures</option>
            <option value="receipt">Reçus</option>
            <option value="contract">Contrats</option>
            <option value="other">Autres</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="rounded-lg bg-white shadow">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-gray-500">Chargement des documents...</p>
          </div>
        ) : filteredDocuments && filteredDocuments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-500">
                      {doc.document_type} • {formatDate(doc.upload_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center p-8">
            <FileText className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Aucun document
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Commencez par importer votre premier document
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
