import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Store, Package, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import useStore from '@/stores/useStore';

const ProveedorModal = ({ isOpen, onClose, proveedor }) => {
  const { productos, addProveedor, updateProveedor, setLoading } = useStore();
  const [formData, setFormData] = useState({
    nombre_proveedor: '',
    id_producto: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!proveedor;

  useEffect(() => {
    if (isOpen) {
      if (proveedor) {
        setFormData({
          nombre_proveedor: proveedor.nombre_proveedor || '',
          id_producto: proveedor.id_producto?.toString() || ''
        });
      } else {
        setFormData({
          nombre_proveedor: '',
          id_producto: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, proveedor]);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo específico
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre_proveedor.trim()) {
      newErrors.nombre_proveedor = 'El nombre del proveedor es requerido';
    }

    if (!formData.id_producto) {
      newErrors.id_producto = 'Debe seleccionar un producto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const proveedorData = {
        nombre_proveedor: formData.nombre_proveedor.trim(),
        id_producto: formData.id_producto ? parseInt(formData.id_producto) : null
      };

      let response;
      if (isEditing) {
        // Actualizar proveedor existente
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/proveedores/${proveedor.id_proveedor}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(proveedorData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.mensaje || 'Error al actualizar el proveedor');
        }

        // Actualizar el store local
        updateProveedor(proveedor.id_proveedor, {
          ...proveedorData,
          id_proveedor: proveedor.id_proveedor
        });
        
        toast({
          title: "Proveedor actualizado",
          description: `${proveedorData.nombre_proveedor} ha sido actualizado correctamente.`
        });
      } else {
        // Crear nuevo proveedor
        response = await fetch('${import.meta.env.VITE_API_URL}/api/proveedores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(proveedorData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.mensaje || 'Error al crear el proveedor');
        }

        const responseData = await response.json();
        
        // Agregar el nuevo proveedor al store local
        const nuevoProveedor = {
          ...proveedorData,
          id_proveedor: responseData.id
        };
        
        addProveedor(nuevoProveedor);
        
        toast({
          title: "Proveedor creado",
          description: `${proveedorData.nombre_proveedor} ha sido agregado al sistema.`
        });
      }

      onClose();
    } catch (error) {
      console.error('Error al procesar el proveedor:', error);
      toast({
        title: "Error",
        description: error.message || `No se pudo ${isEditing ? 'actualizar' : 'crear'} el proveedor.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const getProductoNombre = (id) => {
    const producto = productos.find(p => p.id_producto === parseInt(id));
    return producto ? producto.nombre : '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🏪 {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_proveedor">Nombre del Proveedor *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="nombre_proveedor"
                name="nombre_proveedor"
                placeholder="Ej: Distribuidora Valle Verde"
                value={formData.nombre_proveedor}
                onChange={(e) => handleChange('nombre_proveedor', e.target.value)}
                className={`pl-10 ${errors.nombre_proveedor ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.nombre_proveedor && (
              <p className="text-sm text-destructive">{errors.nombre_proveedor}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_producto">Producto Asociado *</Label>
            <Select
              value={formData.id_producto}
              onValueChange={(value) => handleChange('id_producto', value)}
            >
              <SelectTrigger className={errors.id_producto ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecciona un producto">
                  {formData.id_producto && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {getProductoNombre(formData.id_producto)}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {productos.length === 0 ? (
                  <SelectItem value="" disabled>
                    No hay productos disponibles
                  </SelectItem>
                ) : (
                  productos.map((producto) => (
                    <SelectItem 
                      key={producto.id_producto} 
                      value={producto.id_producto.toString()}
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>{producto.nombre}</span>
                        <span className="text-muted-foreground text-sm">
                          (${producto.precio})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.id_producto && (
              <p className="text-sm text-destructive">{errors.id_producto}</p>
            )}
            {productos.length === 0 && (
              <p className="text-sm text-warning">
                ⚠️ Debe agregar productos antes de crear proveedores
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-dark"
              disabled={isSubmitting || productos.length === 0}
            >
              {isSubmitting 
                ? (isEditing ? 'Actualizando...' : 'Creando...') 
                : (isEditing ? 'Actualizar' : 'Crear')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProveedorModal;