import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, UserCog, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function UsersManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
    isAdmin: false
  });
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const res = await apiRequest("POST", "/api/admin/users", userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsCreateDialogOpen(false);
      setNewUser({ username: "", password: "", name: "", phone: "", isAdmin: false });
      toast({ title: "Usuário criado", description: "O usuário foi criado com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setUserToDelete(null);
      toast({ title: "Usuário removido", description: "O usuário foi removido com sucesso." });
    },
    onError: (error: Error) => {
      setUserToDelete(null);
      toast({ title: "Erro ao remover usuário", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email, senha e nome.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Gerenciar Usuários</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="username"
                  type="email"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="usuario@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdmin"
                  checked={newUser.isAdmin}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, isAdmin: checked === true })}
                />
                <Label htmlFor="isAdmin">Usuário administrador</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Carregando usuários...</p>
          </div>
        ) : !users || users.length === 0 ? (
          <div className="p-10 text-center border rounded-lg">
            <p className="text-xl text-gray-500 mb-2">Nenhum usuário encontrado</p>
            <p className="text-gray-400">Crie um novo usuário para começar.</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left">Usuário</th>
                <th className="py-3 px-4 text-left">Contato</th>
                <th className="py-3 px-4 text-left">Tipo</th>
                <th className="py-3 px-4 text-left">Criado em</th>
                <th className="py-3 px-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium flex items-center">
                        {user.isAdmin ? (
                          <UserCog className="h-4 w-4 mr-2 text-blue-600" />
                        ) : (
                          <UserIcon className="h-4 w-4 mr-2 text-gray-600" />
                        )}
                        {user.name || user.username}
                      </div>
                      <div className="text-sm text-gray-500">{user.username}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {user.phone && <div>{user.phone}</div>}
                      {!user.phone && <div className="text-gray-400">—</div>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isAdmin
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'Administrador' : 'Cliente'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    {currentUser?.id !== user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => setUserToDelete(user.id)}
                        disabled={deleteUserMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AlertDialog open={userToDelete !== null} onOpenChange={(open) => { if (!open) setUserToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
              onClick={() => userToDelete !== null && deleteUserMutation.mutate(userToDelete)}
            >
              {deleteUserMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
