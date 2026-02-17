import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import useStore from '@/stores/useStore';

const UsuarioModal = ({ isOpen, onClose, usuario }) => {
  const { addUsuario, updateUsuario, setLoading } = useStore();
  const [formData, setFormData] = useState({
    documento: '',
    email: '',
    contraseña: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!usuario;

  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        setFormData({
          documento: usuario.documento?.toString() || '',
          email: usuario.email || '',
          contraseña: '' // No mostramos la contraseña actual
        });
      } else {
        setFormData({
          documento: '',
          email: '',
          contraseña: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, usuario]);

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

    if (!formData.documento) {
      newErrors.documento = 'El documento es requerido';
    } else if (isNaN(formData.documento) || formData.documento.length < 7) {
      newErrors.documento = 'El documento debe ser un número válido de al menos 7 dígitos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido';
    }

    if (!isEditing && !formData.contraseña) {
      newErrors.contraseña = 'La contraseña es requerida';
    } else if (formData.contraseña && formData.contraseña.length < 6) {
      newErrors.contraseña = 'La contraseña debe tener al menos 6 caracteres';
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
      const usuarioData = {
        documento: parseInt(formData.documento),
        email: formData.email.trim().toLowerCase(),
      };

      // Solo incluir contraseña si se proporcionó
      if (formData.contraseña) {
        usuarioData.contraseña = formData.contraseña;
      }

      if (isEditing) {
        // Actualizar usuario existente en el backend
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/usuarios/${usuario.documento}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(usuarioData)
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error al actualizar el usuario');
        }

        // Actualizar el estado local
        const updatedUser = await response.json();
        updateUsuario(usuario.documento, updatedUser);
        
        toast({
          title: "Usuario actualizado",
          description: `${usuarioData.email} ha sido actualizado correctamente.`
        });
      } else {
        // Crear nuevo usuario
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(usuarioData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error al crear el usuario');
        }

        const newUser = await response.json();
        addUsuario(newUser);
        
        toast({
          title: "Usuario creado",
          description: `${usuarioData.email} ha sido agregado al sistema.`
        });
      }

      onClose();
    } catch (error) {
      console.error('Error al guardar el usuario:', error);
      toast({
        title: "Error",
        description: error.message || `No se pudo ${isEditing ? 'actualizar' : 'crear'} el usuario.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            👤 {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="documento">Documento *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="documento"
                name="documento"
                type="number"
                placeholder="12345678"
                value={formData.documento}
                onChange={handleChange}
                className={`pl-10 ${errors.documento ? 'border-destructive' : ''}`}
                disabled={isEditing} // No permitir cambiar documento en edición
              />
            </div>
            {errors.documento && (
              <p className="text-sm text-destructive">{errors.documento}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraseña">
              Contraseña {isEditing && '(dejar vacío para mantener actual)'}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="contraseña"
                name="contraseña"
                type={showPassword ? "text" : "password"}
                placeholder={isEditing ? "Nueva contraseña..." : "••••••••"}
                value={formData.contraseña}
                onChange={handleChange}
                className={`pl-10 pr-10 ${errors.contraseña ? 'border-destructive' : ''}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.contraseña && (
              <p className="text-sm text-destructive">{errors.contraseña}</p>
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

export default UsuarioModal;