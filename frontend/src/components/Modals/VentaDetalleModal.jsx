import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DollarSign, Package, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const VentaDetalleModal = ({ isOpen, onClose, venta: initialVenta }) => {
  const [venta, setVenta] = useState(initialVenta);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetalleVenta = async () => {
      if (!isOpen || !initialVenta?.id_venta) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Primero obtenemos los datos principales de la venta
        const [ventaResponse, detallesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${initialVenta.id_venta}`),
          fetch(`${import.meta.env.VITE_API_URL}/api/detalle_venta/${initialVenta.id_venta}`)
        ]);
        
        if (!ventaResponse.ok) {
          const errorData = await ventaResponse.json();
          throw new Error(errorData.error || 'Error al cargar los datos de la venta');
        }
        
        const ventaData = await ventaResponse.json();
        let detallesData = [];
        
        // Solo intentamos obtener los detalles si la respuesta es exitosa
        if (detallesResponse.ok) {
          detallesData = await detallesResponse.json();
        }
        
        // Mapear los datos de la API al formato esperado por el componente
        const ventaFormateada = {
          ...ventaData,
          total: parseFloat(ventaData.total),
          fecha: new Date(ventaData.fecha).toISOString(),
          productos: detallesData.map(detalle => ({
            id_producto: detalle.id_producto,
            nombre: detalle.nombre || `Producto ${detalle.id_producto}`,
            cantidad: detalle.cantidad,
            precio_unitario: detalle.precio_unitario ? parseFloat(detalle.precio_unitario) : 0,
            subtotal: detalle.cantidad * (detalle.precio_unitario ? parseFloat(detalle.precio_unitario) : 0)
          })) || []
        };
        
        setVenta(ventaFormateada);
      } catch (err) {
        console.error('Error al cargar el detalle de la venta:', err);
        setError(err.message);
        toast({
          title: "Error",
          description: err.message || "No se pudo cargar el detalle de la venta",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchDetalleVenta();
    } else {
      // Resetear el estado cuando se cierra el modal
      setVenta(initialVenta);
      setError(null);
    }
  }, [isOpen, initialVenta]);

  if (!venta) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {isLoading ? 'Cargando...' : `Detalle de Venta #${venta.id_venta}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p>Error al cargar el detalle de la venta</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Información general */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(venta.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(venta.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de productos */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos ({venta.productos?.length || 0})
              </h4>
              
              <div className="space-y-3">
                {venta.productos?.map((producto, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium">{producto.nombre}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          Cant: {producto.cantidad}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatPrice(producto.precio_unitario)} c/u
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(producto.subtotal)}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">
                    No hay productos en esta venta
                  </p>
                )}
              </div>
            </div>

            {/* Resumen */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Final:</span>
                <span className="text-primary">{formatPrice(venta.total)}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VentaDetalleModal;