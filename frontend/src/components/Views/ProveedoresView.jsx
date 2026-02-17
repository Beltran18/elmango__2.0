import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Store, Package, Building } from 'lucide-react';
import useStore from '@/stores/useStore';
import ProveedorModal from '../Modals/ProveedorModal';
import ConfirmDialog from '../Common/ConfirmDialog';
import { toast } from '@/hooks/use-toast';

const ProveedoresView = () => {
  const { 
    proveedores, 
    productos,
    setProveedores, 
    deleteProveedor,
    isLoading,
    setLoading 
  } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, proveedor: null });

  // Cargar proveedores desde la API
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        setLoading(true);
        const response = await fetch('${import.meta.env.VITE_API_URL}/api/proveedores');
        
        if (!response.ok) {
          throw new Error('Error al cargar los proveedores');
        }
        
        const data = await response.json();
        setProveedores(data);
      } catch (error) {
        console.error('Error al cargar proveedores:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los proveedores. Intente nuevamente.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProveedores();
  }, [setProveedores, setLoading]);

  const handleEdit = (proveedor) => {
    setEditingProveedor(proveedor);
    setIsModalOpen(true);
  };

  const handleDelete = (proveedor) => {
    setDeleteDialog({ open: true, proveedor });
  };

  const confirmDelete = async () => {
    if (deleteDialog.proveedor) {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/proveedores/${deleteDialog.proveedor.id_proveedor}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.mensaje || 'Error al eliminar el proveedor');
        }

        // Actualizar el estado local después de eliminar
        deleteProveedor(deleteDialog.proveedor.id_proveedor);
        
        toast({
          title: "Proveedor eliminado",
          description: `${deleteDialog.proveedor.nombre_proveedor} ha sido eliminado correctamente.`
        });
      } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar el proveedor.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        setDeleteDialog({ open: false, proveedor: null });
      }
    }
  };

  const getProductoNombre = (id_producto) => {
    const producto = productos.find(p => p.id_producto === id_producto);
    return producto ? producto.nombre : 'Producto no encontrado';
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
            <Store className="h-8 w-8 text-primary" />
            Proveedores
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los proveedores y sus productos
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingProveedor(null);
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary-dark"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Proveedor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Proveedores</p>
                <p className="text-2xl font-bold">{proveedores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-success" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Productos Cubiertos</p>
                <p className="text-2xl font-bold">{new Set(proveedores.map(p => p.id_producto)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-warning" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Proveedores Activos</p>
                <p className="text-2xl font-bold">{proveedores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proveedores List */}
      {proveedores.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay proveedores</h3>
            <p className="text-muted-foreground mb-4">
              Comienza agregando tu primer proveedor al sistema
            </p>
            <Button 
              onClick={() => {
                setEditingProveedor(null);
                setIsModalOpen(true);
              }}
              className="bg-primary hover:bg-primary-dark"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Proveedor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proveedores.map((proveedor) => (
            <Card key={proveedor.id_proveedor} className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {proveedor.nombre_proveedor}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ID:</span>
                    <Badge variant="outline">{proveedor.id_proveedor}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Producto:</span>
                    </div>
                    <Badge variant="secondary" className="w-full justify-center">
                      {getProductoNombre(proveedor.id_producto)}
                    </Badge>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(proveedor)}
                      className="flex-1"
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(proveedor)}
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
      <ProveedorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProveedor(null);
        }}
        proveedor={editingProveedor}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, proveedor: null })}
        onConfirm={confirmDelete}
        title="Eliminar Proveedor"
        description={`¿Estás seguro de que deseas eliminar "${deleteDialog.proveedor?.nombre_proveedor}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default ProveedoresView;