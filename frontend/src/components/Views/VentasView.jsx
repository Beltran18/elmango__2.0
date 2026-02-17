import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, Eye } from 'lucide-react';
import useStore from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import VentaDetalleModal from '../Modals/VentaDetalleModal';

const VentasView = () => {
  const { ventas, setVentas, isLoading } = useStore();
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);

  // Obtener ventas desde la API
  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await fetch('${import.meta.env.VITE_API_URL}/api/ventas');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al obtener las ventas');
        }
        
        const ventasData = await response.json();
        
        // Mapear los datos de la API al formato esperado por el componente
        const ventasFormateadas = ventasData.map(venta => ({
          id_venta: venta.id_venta,
          total: parseFloat(venta.total),
          fecha: new Date(venta.fecha).toISOString(),
          // Asegurarse de que los detalles de la venta tengan el formato correcto
          productos: venta.detalles_venta?.map(detalle => ({
            id_producto: detalle.id_producto,
            nombre: detalle.nombre_producto || `Producto ${detalle.id_producto}`,
            cantidad: detalle.cantidad,
            precio_unitario: parseFloat(detalle.precio_unitario),
            subtotal: parseFloat(detalle.cantidad * detalle.precio_unitario)
          })) || []
        }));
        
        setVentas(ventasFormateadas);
      } catch (error) {
        console.error('Error al cargar las ventas:', error);
        // Mostrar un mensaje de error al usuario
        // Aquí podrías usar un toast o un componente de error
      }
    };

    fetchVentas();
  }, [setVentas]);

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVerDetalle = (venta) => {
    setSelectedVenta(venta);
    setDetalleModalOpen(true);
  };

  // Cálculos para estadísticas
  const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
  const promedioVenta = ventas.length > 0 ? totalVentas / ventas.length : 0;
  const ventaMaxima = ventas.length > 0 ? Math.max(...ventas.map(v => v.total)) : 0;

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
            <DollarSign className="h-8 w-8 text-primary" />
            Ventas
          </h1>
          <p className="text-muted-foreground mt-2">
            Historial y estadísticas de ventas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Ventas</p>
                <p className="text-2xl font-bold">{formatPrice(totalVentas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-success" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Promedio por Venta</p>
                <p className="text-2xl font-bold">{formatPrice(promedioVenta)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-warning" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Cantidad Ventas</p>
                <p className="text-2xl font-bold">{ventas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Badge variant="outline" className="h-8 w-8 text-success border-success">
                ⭐
              </Badge>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Venta Máxima</p>
                <p className="text-2xl font-bold">{formatPrice(ventaMaxima)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      {ventas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay ventas registradas</h3>
            <p className="text-muted-foreground mb-4">
              Las ventas aparecerán aquí cuando se procesen desde el carrito
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ventas
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .map((venta) => (
                <div key={venta.id_venta} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Venta #{venta.id_venta}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(venta.fecha)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-lg text-primary">
                        {formatPrice(venta.total)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {venta.productos?.length || 0} productos
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerDetalle(venta)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Ver Detalle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalle */}
      <VentaDetalleModal
        isOpen={detalleModalOpen}
        onClose={() => {
          setDetalleModalOpen(false);
          setSelectedVenta(null);
        }}
        venta={selectedVenta}
      />
    </div>
  );
};

export default VentasView;