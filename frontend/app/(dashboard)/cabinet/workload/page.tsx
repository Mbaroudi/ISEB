"use client";

import { useCabinetWorkload } from "@/lib/hooks/useCabinet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardList } from "lucide-react";

export default function WorkloadPage() {
  const { data, isLoading } = useCabinetWorkload();

  if (isLoading) return <div className="p-8">Chargement...</div>;

  const { workload = [], overall_stats } = data || {};

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Charge de Travail</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Tâches</div>
            <div className="text-2xl font-bold">{overall_stats?.total_tasks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Heures Estimées</div>
            <div className="text-2xl font-bold">{overall_stats?.total_estimated_hours || 0}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">En Retard</div>
            <div className="text-2xl font-bold text-red-600">{overall_stats?.total_overdue || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Haute Priorité</div>
            <div className="text-2xl font-bold text-orange-600">{overall_stats?.total_high_priority || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workload.map((user) => (
          <Card key={user.user_id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {user.user_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total tâches</span>
                <Badge>{user.total_tasks}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><span className="text-muted-foreground">À faire</span><div className="font-bold">{user.todo_tasks}</div></div>
                <div><span className="text-muted-foreground">En cours</span><div className="font-bold text-blue-600">{user.in_progress_tasks}</div></div>
                <div><span className="text-muted-foreground">Terminé</span><div className="font-bold text-green-600">{user.done_tasks}</div></div>
              </div>
              {user.overdue_tasks > 0 && (
                <div className="text-sm text-red-600 font-medium">⚠️ {user.overdue_tasks} en retard</div>
              )}
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">Heures</div>
                <div className="flex justify-between text-sm">
                  <span>Estimées: {user.total_estimated_hours}h</span>
                  <span>Passées: {user.total_spent_hours}h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
