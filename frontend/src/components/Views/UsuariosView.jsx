import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Mail, User } from 'lucide-react';
import useStore from '@/stores/useStore';
import UsuarioModal from '../Modals/UsuarioModal';
import ConfirmDialog from '../Common/ConfirmDialog';
import { toast } from '@/hooks/use-toast';

const UsuariosView = () => {
  const { 
    usuarios, 
    setUsuarios, 
    deleteUsuario,
    isLoading,
    setLoading 
  } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, usuario: null });

  // Cargar usuarios desde la API
  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los usuarios');
      }
      
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario);
    setIsModalOpen(true);
  };

  const handleDelete = (usuario) => {
    setDeleteDialog({ open: true, usuario });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.usuario) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/usuarios/${deleteDialog.usuario.documento}`, 
        {
          method: 'DELETE'
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar el usuario');
      }
      
      // Actualizar el estado local
      deleteUsuario(deleteDialog.usuario.documento);
      
      toast({
        title: "Usuario eliminado",
        description: `Usuario ${deleteDialog.usuario.email} ha sido eliminado correctamente.`
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setDeleteDialog({ open: false, usuario: null });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Usuarios
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingUsuario(null);
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary-dark"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold">{usuarios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-success" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                <p className="text-2xl font-bold">{usuarios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      {usuarios.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay usuarios</h3>
            <p className="text-muted-foreground mb-4">
              Comienza agregando tu primer usuario al sistema
            </p>
            <Button 
              onClick={() => {
                setEditingUsuario(null);
                setIsModalOpen(true);
              }}
              className="bg-primary hover:bg-primary-dark"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Usuario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map((usuario) => (
            <Card key={usuario.documento} className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {usuario.email}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Documento:</span>
                    <Badge variant="outline">{usuario.documento}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {usuario.email}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(usuario)}
                      className="flex-1"
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(usuario)}
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUsuario(null);
        }}
        usuario={editingUsuario}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, usuario: null })}
        onConfirm={confirmDelete}
        title="Eliminar Usuario"
        description={`¿Estás seguro de que deseas eliminar el usuario "${deleteDialog.usuario?.email}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default UsuariosView;