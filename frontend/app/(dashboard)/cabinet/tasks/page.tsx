"use client";

import { useState } from "react";
import { useCabinetTasks, useCompleteTask, useCreateTask } from "@/lib/hooks/useCabinet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Clock, AlertCircle, Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CabinetTasksPage() {
  const [stateFilter, setStateFilter] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const { data: tasks, isLoading } = useCabinetTasks({
    state: stateFilter || undefined,
  });

  const completeTask = useCompleteTask();
  const createTask = useCreateTask();

  const handleCompleteTask = async (taskId: number) => {
    try {
      await completeTask.mutateAsync(taskId);
      toast({
        title: "Tâche terminée",
        description: "La tâche a été marquée comme terminée.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de terminer la tâche.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createTask.mutateAsync({
        name: formData.get("name"),
        description: formData.get("description"),
        partner_id: parseInt(formData.get("partner_id") as string),
        task_type: formData.get("task_type"),
        priority: formData.get("priority"),
        deadline: formData.get("deadline") || undefined,
      });

      toast({
        title: "Tâche créée",
        description: "La nouvelle tâche a été créée avec succès.",
      });
      setShowCreateDialog(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche.",
        variant: "destructive",
      });
    }
  };

  const getStateBadge = (state: string) => {
    const configs = {
      todo: { variant: "outline" as const, label: "À faire", icon: Clock },
      in_progress: {
        variant: "default" as const,
        label: "En cours",
        icon: AlertCircle,
      },
      done: { variant: "default" as const, label: "Terminé", icon: CheckCircle2 },
      cancelled: { variant: "destructive" as const, label: "Annulé", icon: AlertCircle },
    };

    const config = configs[state as keyof typeof configs] || configs.todo;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      "0": { variant: "outline" as const, label: "Basse" },
      "1": { variant: "outline" as const, label: "Normale" },
      "2": { variant: "default" as const, label: "Haute" },
      "3": { variant: "destructive" as const, label: "Urgente" },
    };

    const config = configs[priority as keyof typeof configs] || configs["1"];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const tasksByState = {
    todo: tasks?.filter((t) => t.state === "todo") || [],
    in_progress: tasks?.filter((t) => t.state === "in_progress") || [],
    done: tasks?.filter((t) => t.state === "done") || [],
  };

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tâches Cabinet</h1>
          <p className="text-muted-foreground mt-1">
            {tasks?.length || 0} tâches au total
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Tâche
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une tâche</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <Label htmlFor="name">Titre *</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div>
                <Label htmlFor="partner_id">Client ID *</Label>
                <Input
                  id="partner_id"
                  name="partner_id"
                  type="number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="task_type">Type</Label>
                <Select name="task_type" defaultValue="other">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="declaration">Déclaration</SelectItem>
                    <SelectItem value="document_review">
                      Révision documents
                    </SelectItem>
                    <SelectItem value="expense_validation">
                      Validation notes de frais
                    </SelectItem>
                    <SelectItem value="meeting">Réunion/RDV</SelectItem>
                    <SelectItem value="followup">Relance/Suivi</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select name="priority" defaultValue="1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Basse</SelectItem>
                    <SelectItem value="1">Normale</SelectItem>
                    <SelectItem value="2">Haute</SelectItem>
                    <SelectItem value="3">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deadline">Échéance</Label>
                <Input id="deadline" name="deadline" type="date" />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={createTask.isPending}>
                  {createTask.isPending ? "Création..." : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* À faire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              À faire ({tasksByState.todo.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByState.todo.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="space-y-2">
                  <div className="font-medium">{task.name}</div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.priority)}
                    {task.is_overdue && (
                      <Badge variant="destructive">En retard</Badge>
                    )}
                  </div>
                  {task.deadline && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.deadline).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {task.partner_id[1]}
                  </div>
                </div>
              </Card>
            ))}
            {tasksByState.todo.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune tâche
              </div>
            )}
          </CardContent>
        </Card>

        {/* En cours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              En cours ({tasksByState.in_progress.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByState.in_progress.map((task) => (
              <Card key={task.id} className="p-4 border-blue-200">
                <div className="space-y-2">
                  <div className="font-medium">{task.name}</div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.priority)}
                  </div>
                  {task.deadline && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.deadline).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={completeTask.isPending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Terminer
                  </Button>
                </div>
              </Card>
            ))}
            {tasksByState.in_progress.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune tâche
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terminé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Terminé ({tasksByState.done.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByState.done.map((task) => (
              <Card key={task.id} className="p-4 bg-green-50">
                <div className="space-y-2">
                  <div className="font-medium text-muted-foreground">
                    {task.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {task.partner_id[1]}
                  </div>
                </div>
              </Card>
            ))}
            {tasksByState.done.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune tâche
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
