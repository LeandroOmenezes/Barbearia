import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, CalendarX, Plus, Globe, User } from "lucide-react";
import type { ScheduleBlock, Professional } from "@shared/schema";

const blockFormSchema = z.object({
  professionalId: z.string().optional(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de fim é obrigatória"),
  reason: z.string().min(1, "Motivo é obrigatório"),
  description: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "A data de fim não pode ser anterior à data de início",
  path: ["endDate"],
});

type BlockFormValues = z.infer<typeof blockFormSchema>;

const REASON_OPTIONS = ["Férias", "Atestado médico", "Viagem", "Feriado", "Outros"];

export default function ScheduleBlocksManagement() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const { data: blocks = [], isLoading } = useQuery<ScheduleBlock[]>({
    queryKey: ["/api/schedule-blocks"],
  });

  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ["/api/professionals"],
  });

  const form = useForm<BlockFormValues>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: {
      professionalId: "",
      startDate: "",
      endDate: "",
      reason: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: BlockFormValues) => {
      const payload = {
        ...data,
        professionalId: (data.professionalId && data.professionalId !== "none")
          ? parseInt(data.professionalId)
          : null,
      };
      return apiRequest("POST", "/api/schedule-blocks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-blocks"] });
      form.reset();
      setShowForm(false);
      toast({ title: "Bloqueio criado", description: "O período foi bloqueado com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Erro ao criar bloqueio", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/schedule-blocks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-blocks"] });
      toast({ title: "Bloqueio removido", description: "O período foi desbloqueado com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao remover bloqueio", variant: "destructive" });
    },
  });

  const onSubmit = (data: BlockFormValues) => createMutation.mutate(data);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const isBlockActive = (block: ScheduleBlock) => {
    const today = new Date().toISOString().split("T")[0];
    return block.startDate <= today && block.endDate >= today;
  };

  const getProfessionalName = (professionalId: number | null) => {
    if (!professionalId) return null;
    return professionals.find(p => p.id === professionalId)?.name || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Bloqueios de Agenda</h3>
          <p className="text-sm text-gray-500">Bloqueie períodos por profissional ou para toda a equipe.</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} variant={showForm ? "outline" : "default"} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancelar" : "Novo Bloqueio"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarX className="h-5 w-5 text-red-500" />
              Bloquear Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Professional selector */}
                <FormField
                  control={form.control}
                  name="professionalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissional (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Toda a equipe (bloqueio geral)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-gray-400" />
                              Toda a equipe (bloqueio geral)
                            </span>
                          </SelectItem>
                          {professionals.filter(p => p.active).map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              <span className="flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-500" />
                                {p.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Deixe em branco para bloquear todos os profissionais neste período.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Fim</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {REASON_OPTIONS.map(option => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => field.onChange(option)}
                                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                  field.value === option
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-primary"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                          <Input placeholder="Ou digite um motivo personalizado..." {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Informações adicionais para registro interno..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); form.reset(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-red-600 hover:bg-red-700">
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <CalendarX className="h-4 w-4 mr-2" />
                    Bloquear Agenda
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : blocks.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <CalendarX className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum bloqueio cadastrado.</p>
          <p className="text-xs mt-1">A agenda está disponível normalmente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map(block => {
            const active = isBlockActive(block);
            const professionalName = getProfessionalName(block.professionalId ?? null);
            return (
              <div
                key={block.id}
                className={`flex items-start justify-between p-4 rounded-lg border ${
                  active ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-gray-800">
                      {formatDate(block.startDate)}
                      {block.startDate !== block.endDate && ` → ${formatDate(block.endDate)}`}
                    </span>
                    <Badge variant={active ? "destructive" : "secondary"} className="text-xs">
                      {active ? "Ativo" : block.endDate < new Date().toISOString().split("T")[0] ? "Expirado" : "Futuro"}
                    </Badge>
                    {professionalName ? (
                      <Badge variant="outline" className="text-xs flex items-center gap-1 text-blue-700 border-blue-300">
                        <User className="w-3 h-3" />
                        {professionalName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs flex items-center gap-1 text-gray-600">
                        <Globe className="w-3 h-3" />
                        Toda a equipe
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-red-700">{block.reason}</p>
                  {block.description && (
                    <p className="text-xs text-gray-500 mt-1">{block.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(block.id)}
                  disabled={deleteMutation.isPending}
                  className="text-gray-400 hover:text-red-600 ml-3 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
