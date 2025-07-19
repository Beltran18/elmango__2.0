import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import useStore from '@/stores/useStore';

const ProductoModal = ({ isOpen, onClose, producto }) => {
  const { addProducto, updateProducto, setLoading } = useStore();
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!producto;

  useEffect(() => {
    if (isOpen) {
      if (producto) {
        setFormData({
          nombre: producto.nombre || '',
          descripcion: producto.descripcion || '',
          precio: producto.precio?.toString() || ''
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          precio: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, producto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.precio) {
      newErrors.precio = 'El precio es requerido';
    } else if (isNaN(formData.precio) || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser un número mayor a 0';
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
      const productoData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: parseFloat(formData.precio)
      };

      if (isEditing) {
        // Actualizar producto existente
        updateProducto(producto.id_producto, productoData);
        toast({
          title: "Producto actualizado",
          description: `${productoData.nombre} ha sido actualizado correctamente.`
        });
      } else {
        // Crear nuevo producto en el backend
        const response = await fetch('http://localhost:3000/api/productos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productoData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al crear el producto');
        }

        const nuevoProducto = await response.json();
        
        // Actualizar el estado global con el nuevo producto
        addProducto(nuevoProducto);
        
        toast({
          title: "¡Producto creado!",
          description: `${productoData.nombre} ha sido agregado al inventario correctamente.`
        });
      }

      onClose();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      toast({
        title: "Error",
        description: error.message || `No se pudo ${isEditing ? 'actualizar' : 'crear'} el producto.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(number);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📦 {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Producto *</Label>
            <Input
              id="nombre"
              name="nombre"
              placeholder="Ej: Mango Tommy"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'border-destructive' : ''}
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Describe las características del producto..."
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="precio">Precio *</Label>
            <div className="relative">
              <Input
                id="precio"
                name="precio"
                type="number"
                placeholder="0"
                value={formData.precio}
                onChange={handleChange}
                className={`${errors.precio ? 'border-destructive' : ''}`}
                min="0"
                step="100"
              />
              <div className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                COP
              </div>
            </div>
            {formData.precio && !errors.precio && (
              <p className="text-sm text-muted-foreground">
                Precio: {formatCurrency(formData.precio)}
              </p>
            )}
            {errors.precio && (
              <p className="text-sm text-destructive">{errors.precio}</p>
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
              disabled={isSubmitting}
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

export default ProductoModal;