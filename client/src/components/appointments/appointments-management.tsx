
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Appointment, Service, type Professional } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, X, MessageCircle, Eye } from "lucide-react";

export default function AppointmentsManagement() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ['/api/services/all'],
  });

  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ['/api/professionals'],
  });

  const { data: siteConfig } = useQuery<{ siteName?: string }>({
    queryKey: ['/api/site-config'],
  });

  const { data: footerConfig } = useQuery<{ whatsapp?: string }>({
    queryKey: ['/api/footer'],
  });

  const formatClientPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const notifyClientViaWhatsApp = async (appointment: Appointment, newStatus: string) => {
    if (!appointment.phone) return;

    const salonName = siteConfig?.siteName || 'Salão';
    const serviceName = getServiceName(appointment.serviceId);
    const dateFormatted = formatDate(appointment.date);

    let message = '';
    if (newStatus === 'confirmed') {
      message =
        `Olá, ${appointment.name}! 😊\n\n` +
        `✅ *Seu agendamento foi CONFIRMADO!*\n\n` +
        `📋 *Detalhes:*\n` +
        `• Serviço: ${serviceName}\n` +
        `• Data: ${dateFormatted}\n` +
        `• Horário: ${appointment.time}\n\n` +
        `Aguardamos você com prazer! Qualquer dúvida, é só falar. 🙏\n\n` +
        `— ${salonName}`;
    } else if (newStatus === 'cancelled') {
      message =
        `Olá, ${appointment.name}.\n\n` +
        `❌ *Seu agendamento foi CANCELADO.*\n\n` +
        `📋 *Detalhes do agendamento cancelado:*\n` +
        `• Serviço: ${serviceName}\n` +
        `• Data: ${dateFormatted}\n` +
        `• Horário: ${appointment.time}\n\n` +
        `Sentimos muito pelo inconveniente. Entre em contato para reagendar quando quiser. 💙\n\n` +
        `— ${salonName}`;
    } else {
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Mensagem copiada!",
        description: `Cole no WhatsApp do cliente ${appointment.name} (${appointment.phone}).`,
        duration: 6000,
      });
    } catch {
      // fallback: abre o WhatsApp Web caso clipboard não esteja disponível
      const clientPhone = formatClientPhone(appointment.phone);
      const url = `https://web.whatsapp.com/send?phone=${clientPhone}&text=${encodeURIComponent(message)}`;
      window.open(url, 'whatsapp_notifications');
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, markAsSeen }: { id: number; status: string; markAsSeen?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}/status`, { status });

      if (status === 'confirmed' && markAsSeen) {
        await apiRequest("PATCH", `/api/appointments/${id}/mark-seen`, {});
      }

      return { appointment: await res.json(), status };
    },
    onSuccess: ({ appointment, status }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/available-times'] });

      const statusLabel = status === 'confirmed' ? 'confirmado' : status === 'cancelled' ? 'cancelado' : 'atualizado';
      toast({
        title: "Status atualizado",
        description: `Agendamento ${statusLabel} com sucesso.`,
      });

      if (status === 'confirmed' || status === 'cancelled') {
        notifyClientViaWhatsApp(appointment, status);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markSeenMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      await apiRequest("PATCH", `/api/appointments/${appointmentId}/mark-seen`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
  });

  const statusRank: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    completed: 2,
    cancelled: 3,
  };

  const getAppointmentDateTime = (appointment: Appointment) => {
    const datePart = String(appointment.date).slice(0, 10);
    return new Date(`${datePart}T${appointment.time}:00`);
  };

  const getFilteredAppointments = () => {
    if (!appointments) return [];
    const baseAppointments =
      statusFilter === "all"
        ? appointments
        : appointments.filter((appointment) => appointment.status === statusFilter);

    const now = Date.now();

    return [...baseAppointments].sort((a, b) => {
      const rankA = statusRank[a.status ?? ""] ?? 99;
      const rankB = statusRank[b.status ?? ""] ?? 99;
      if (rankA !== rankB) return rankA - rankB;

      const timeA = getAppointmentDateTime(a).getTime();
      const timeB = getAppointmentDateTime(b).getTime();
      const isPastA = timeA < now;
      const isPastB = timeB < now;

      if (isPastA !== isPastB) return isPastA ? 1 : -1;

      // Future: closest first | Past: most recent first
      if (!isPastA && !isPastB) return timeA - timeB;
      return timeB - timeA;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  const isUpcomingAppointment = (appointment: Appointment) => {
    return getAppointmentDateTime(appointment).getTime() >= Date.now();
  };

  const nextPendingAppointmentId = filteredAppointments.find(
    (appointment) => appointment.status === "pending" && isUpcomingAppointment(appointment),
  )?.id;

  const getServiceName = (serviceId: number | string) => {
    if (!services) return "Carregando...";
    const service = services.find(s => s.id === Number(serviceId));
    return service ? service.name : "Serviço não encontrado";
  };

  const getProfessionalName = (professionalId: number | null | undefined) => {
    if (!professionalId) return null;
    const p = professionals.find(pr => pr.id === professionalId);
    return p ? p.name : null;
  };

  const handleConfirmAppointment = (appointment: Appointment) => {
    updateStatusMutation.mutate({
      id: appointment.id,
      status: 'confirmed',
      markAsSeen: !appointment.seenByProfessional,
    });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-xl font-bold text-gray-800">Agendamentos</h3>
          {appointments && appointments.filter(a => !a.seenByProfessional).length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {appointments.filter(a => !a.seenByProfessional).length}
            </span>
          )}
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          {appointments && appointments.filter(a => !a.seenByProfessional).length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={() => {
                appointments.filter(a => !a.seenByProfessional).forEach(appointment => {
                  markSeenMutation.mutate(appointment.id);
                });
              }}
              disabled={markSeenMutation.isPending}
              title="Marcar todos como visto"
            >
              Marcar tudo como visto
            </Button>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Carregando agendamentos...</p>
          </div>
        ) : !appointments || appointments.length === 0 ? (
          <div className="p-10 text-center border rounded-lg">
            <p className="text-xl text-gray-500 mb-2">Nenhum agendamento encontrado</p>
            <p className="text-gray-400">Quando os clientes fizerem agendamentos, eles aparecerão aqui.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`rounded-lg border p-3 ${!appointment.seenByProfessional ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium break-words">{appointment.name}</div>
                      <div className="text-sm text-gray-500 break-all">{appointment.phone}</div>
                      <div className="text-sm text-gray-500 break-all">{appointment.email}</div>
                    </div>
                    {!appointment.seenByProfessional && (
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">NOVO</span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-700">
                    <div><span className="font-medium">Serviço:</span> {getServiceName(appointment.serviceId)}</div>
                    {getProfessionalName(appointment.professionalId) && (
                      <div className="text-xs text-blue-600">👤 {getProfessionalName(appointment.professionalId)}</div>
                    )}
                    <div><span className="font-medium">Data:</span> {formatDate(appointment.date)}</div>
                    <div className="flex items-center gap-2">
                      <span><span className="font-medium">Horário:</span> {appointment.time}</span>
                        {appointment.id === nextPendingAppointmentId && (
                          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 shadow-sm">
                            <Clock className="mr-1 h-3 w-3" />
                            Próximo da fila
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {appointment.status === 'pending' ? 'Pendente' :
                        appointment.status === 'confirmed' ? 'Confirmado' :
                        appointment.status === 'completed' ? 'Concluído' :
                        'Cancelado'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {appointment.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleConfirmAppointment(appointment)}
                          disabled={updateStatusMutation.isPending}
                          title="Confirmar, notificar no WhatsApp e marcar como visto"
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'cancelled' })}
                          disabled={updateStatusMutation.isPending}
                          title="Cancelar e notificar cliente via WhatsApp"
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'completed' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                          onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'pending' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Pendente
                        </Button>
                      </>
                    )}
                    {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                        onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'pending' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        Reativar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left">Cliente</th>
                    <th className="py-3 px-4 text-left">Serviço</th>
                    <th className="py-3 px-4 text-left">Data</th>
                    <th className="py-3 px-4 text-left">Horário</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className={`border-t ${!appointment.seenByProfessional ? 'bg-yellow-50' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="font-medium">{appointment.name}</div>
                            <div className="text-sm text-gray-500">{appointment.phone}</div>
                            <div className="text-sm text-gray-500">{appointment.email}</div>
                          </div>
                          {!appointment.seenByProfessional && (
                            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">NOVO</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{getServiceName(appointment.serviceId)}</div>
                        {getProfessionalName(appointment.professionalId) && (
                          <div className="text-xs text-blue-600 mt-0.5">
                            👤 {getProfessionalName(appointment.professionalId)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">{formatDate(appointment.date)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span>{appointment.time}</span>
                          {appointment.id === nextPendingAppointmentId && (
                            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap text-amber-800 shadow-sm">
                              <Clock className="mr-1 h-3 w-3" />
                              Próximo da fila
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status === 'pending' ? 'Pendente' :
                          appointment.status === 'confirmed' ? 'Confirmado' :
                          appointment.status === 'completed' ? 'Concluído' :
                          'Cancelado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap min-w-[210px]">
                        <div className="flex flex-nowrap gap-2">
                          {appointment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleConfirmAppointment(appointment)}
                                disabled={updateStatusMutation.isPending}
                                title="Confirmar, notificar no WhatsApp e marcar como visto"
                              >
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'cancelled' })}
                                disabled={updateStatusMutation.isPending}
                                title="Cancelar e notificar cliente via WhatsApp"
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'completed' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Concluir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'pending' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Pendente
                              </Button>
                            </>
                          )}
                          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                              onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'pending' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              Reativar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <MessageCircle className="h-3 w-3" />
        <span>Ao confirmar ou cancelar, a mensagem para o cliente é copiada automaticamente — é só colar no WhatsApp Web.</span>
      </div>
    </div>
  );
}
