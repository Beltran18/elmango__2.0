import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Minus, Plus, Trash2, ShoppingCart, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import useStore from '@/stores/useStore';

const CarritoModal = ({ isOpen, onClose }) => {
  const { 
    carrito, 
    updateCarritoQuantity, 
    removeFromCarrito, 
    clearCarrito,
    getCarritoTotal,
    addVenta
  } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCarrito(id);
    } else {
      updateCarritoQuantity(id, newQuantity);
    }
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos antes de procesar la venta.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const total = getCarritoTotal();
      
      // Crear el objeto de venta para la API
      const ventaData = {
        fecha: new Date().toISOString(),
        total: total,
        detalles: carrito.map(item => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          subtotal: item.precio * item.cantidad
        }))
      };

      // Enviar la venta al backend
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ventaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar la venta');
      }

      const ventaProcesada = await response.json();
      
      // Crear la venta para el store local
      const nuevaVenta = {
        id_venta: ventaProcesada.id_venta,
        fecha: ventaProcesada.fecha,
        total: ventaProcesada.total,
        productos: carrito.map(item => ({
          id_producto: item.id_producto,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          subtotal: item.precio * item.cantidad
        }))
      };

      // Agregar venta al store local
      addVenta(nuevaVenta);

      // Limpiar carrito
      clearCarrito();

      toast({
        title: "¡Venta procesada!",
        description: `Venta #${ventaProcesada.id_venta} por ${formatPrice(total)} registrada correctamente.`
      });

      onClose();

    } catch (error) {
      console.error('Error al procesar la venta:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la venta. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const total = getCarritoTotal();
  const itemCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito de Compras
            {itemCount > 0 && (
              <Badge variant="secondary">
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {carrito.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Carrito vacío</h3>
              <p className="text-muted-foreground">
                Agrega productos desde la vista de productos
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {carrito.map((item) => (
                <div key={item.id_producto} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.nombre}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.precio)} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id_producto, item.cantidad - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <Input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 1;
                        updateQuantity(item.id_producto, newQuantity);
                      }}
                      className="w-16 h-8 text-center"
                      min="1"
                    />

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id_producto, item.cantidad + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromCarrito(item.id_producto)}
                      className="h-8 w-8 p-0 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <p className="font-semibold">
                      {formatPrice(item.precio * item.cantidad)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {carrito.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => clearCarrito()}
                className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={isProcessing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Vaciar
              </Button>

              <Button
                onClick={procesarVenta}
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                disabled={isProcessing}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isProcessing ? 'Procesando...' : 'Procesar Venta'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CarritoModal;