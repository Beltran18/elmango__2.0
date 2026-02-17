import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

const RegisterForm = ({ onToggleForm }) => {
  const [formData, setFormData] = useState({
    documento: '',
    email: '',
    contraseña: '',
    confirmarContraseña: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  // Función para verificar si un usuario ya existe
  const verificarUsuarioExistente = async (documento, email) => {
    try {
      // Verificar por documento
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${documento}`);
      
      if (response.ok) {
        const usuario = await response.json();
        return {
          existe: true,
          mensaje: 'Ya existe un usuario con este documento',
          campo: 'documento'
        };
      }
      
      // Verificar por email
      const responseEmail = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios`);
      if (responseEmail.ok) {
        const usuarios = await responseEmail.json();
        const usuarioConEmail = usuarios.find(u => u.email === email);
        if (usuarioConEmail) {
          return {
            existe: true,
            mensaje: 'Ya existe un usuario con este correo electrónico',
            campo: 'email'
          };
        }
      }
      
      return { existe: false };
    } catch (error) {
      console.error('Error al verificar usuario existente:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validaciones
      if (!formData.documento || !formData.email || !formData.contraseña) {
        setError('Por favor, completa todos los campos');
        return;
      }

      if (formData.contraseña !== formData.confirmarContraseña) {
        setError('Las contraseñas no coinciden');
        return;
      }

      if (formData.contraseña.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Validación de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Por favor ingresa un correo electrónico válido');
        return;
      }

      // Validación de documento (solo números)
      if (!/^\d+$/.test(formData.documento)) {
        setError('El documento solo debe contener números');
        return;
      }

      // Verificar si el usuario ya existe
      const verificacion = await verificarUsuarioExistente(formData.documento, formData.email);
      if (verificacion.existe) {
        setError(verificacion.mensaje);
        return;
      }

      // Llamada a la API de registro
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/usuarios`;
      console.log('Enviando solicitud a:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documento: formData.documento,
          email: formData.email,
          contraseña: formData.contraseña
        })
      });

      // Verificar el tipo de contenido de la respuesta
      const contentType = response.headers.get('content-type') || '';
      let data;
      
      // Obtener la respuesta como texto primero para depuración
      const textResponse = await response.text();
      console.log('Respuesta del servidor (raw):', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        headers: Object.fromEntries(response.headers.entries()),
        body: textResponse.substring(0, 500) // Mostrar solo los primeros 500 caracteres
      });
      
      try {
        // Intentar analizar como JSON si el contenido parece ser JSON
        if (contentType.includes('application/json') || (textResponse.trim().startsWith('{') || textResponse.trim().startsWith('['))) {
          data = JSON.parse(textResponse);
        } else {
          throw new Error('La respuesta no es un JSON válido');
        }
      } catch (parseError) {
        console.error('Error al analizar la respuesta JSON:', parseError);
        console.error('Contenido de la respuesta:', textResponse);
        throw new Error(`Error en la respuesta del servidor (${response.status} ${response.statusText}). La respuesta no es un JSON válido.`);
      }

      if (!response.ok) {
        throw new Error(data.error || data.mensaje || `Error al registrar el usuario (${response.status} ${response.statusText})`);
      }

      // Éxito en el registro
      setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      
      // Limpiar formulario
      setFormData({
        documento: '',
        email: '',
        contraseña: '',
        confirmarContraseña: ''
      });
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        onToggleForm();
      }, 2000);

    } catch (err) {
      console.error('Error en el registro:', {
        message: err.message,
        stack: err.stack,
        formData: {
          ...formData,
          contraseña: '***', // No registrar la contraseña real
          confirmarContraseña: '***'
        }
      });
      setError(err.message || 'Error al registrar usuario. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-elevated animate-scale-in">
      <CardHeader className="text-center pb-6">
        <div className="text-6xl mb-4">🥭</div>
        <CardTitle className="text-2xl font-bold text-center">
          ElMango 2.0
        </CardTitle>
        <p className="text-muted-foreground">Crea tu nueva cuenta</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription className="text-success">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="documento">Documento</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="documento"
                name="documento"
                type="number"
                placeholder="12345678"
                value={formData.documento}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraseña">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="contraseña"
                name="contraseña"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.contraseña}
                onChange={handleChange}
                className="pl-10 pr-10"
                required
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarContraseña">Confirmar Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmarContraseña"
                name="confirmarContraseña"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmarContraseña}
                onChange={handleChange}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark"
            disabled={isLoading}
          >
            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={onToggleForm}
            >
              Inicia sesión aquí
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;