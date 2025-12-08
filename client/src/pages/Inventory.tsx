import React, { useState, useEffect } from 'react';
import { inventoryService, Supply as ApiSupply, SupplyFormData, InventoryFilters, InventoryMovement } from '../services/inventoryService';
import toast from 'react-hot-toast';

// Iconos SVG mejorados
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const ArchiveBoxIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

const ArrowUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

const ArrowDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const Inventory: React.FC = () => {
  // Estados principales
  const [supplies, setSupplies] = useState<ApiSupply[]>([]);
  const [allSupplies, setAllSupplies] = useState<ApiSupply[]>([]); // Para filtrado local
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<ApiSupply | null>(null);
  
  // Estados para movimientos
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  
  // Estados de formularios
  const [formData, setFormData] = useState<SupplyFormData>({
    name: '',
    description: '',
    category: '',
    unit: '',
    stock: 0,
    minStock: 0,
    maxStock: undefined,
    unitPrice: 0,
    supplier: '',
    expirationDate: ''
  });
  
  const [stockMovement, setStockMovement] = useState({
    quantity: 0,
    type: 'add' as 'add' | 'subtract' | 'adjust',
    reason: '',
    unitCost: undefined as number | undefined,
    reference: undefined as string | undefined
  });
  
  // Estados de filtros
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: '',
    status: ''
  });
  
  // Estado para controlar si usar filtrado local o del servidor
  const [useLocalFiltering, setUseLocalFiltering] = useState(false);
  
  // Función auxiliar para obtener el estado del stock
  const getStockStatus = (supply: ApiSupply) => {
    const stock = supply.stock || 0;
    const minStock = supply.minStock || 0;
    if (stock === 0) return 'out_of_stock';
    if (stock <= minStock) return 'low_stock';
    return 'normal';
  };
  
  // Aplicar filtros localmente
  const applyLocalFilters = (dataToFilter?: ApiSupply[]) => {
    const dataSource = dataToFilter || allSupplies;
    let filtered = [...dataSource];
    
    // Filtro de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(supply => 
        supply.name.toLowerCase().includes(searchTerm) ||
        (supply.description && supply.description.toLowerCase().includes(searchTerm)) ||
        supply.category.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtro de categoría
    if (filters.category) {
      filtered = filtered.filter(supply => supply.category === filters.category);
    }
    
    // Filtro de estado de stock
    if (filters.status) {
      filtered = filtered.filter(supply => {
        const status = getStockStatus(supply);
        return status === filters.status;
      });
    }
    
    setSupplies(filtered);
  };
  
  // Cargar supplies
  const loadSupplies = async (forceServerFiltering = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Si usamos filtrado local y ya tenemos datos, no hacer petición al servidor
      if (useLocalFiltering && allSupplies.length > 0 && !forceServerFiltering) {
        setLoading(false);
        return;
      }
      
      // Intentar filtrado del servidor primero
      const serverFilters = forceServerFiltering ? {} : filters;
      const response = await inventoryService.getSupplies(serverFilters);
      
      if (response.success) {
        const data = response.data || [];
        setAllSupplies(data);
        
        if (forceServerFiltering || !useLocalFiltering) {
          setSupplies(data);
        } else {
          applyLocalFilters(data);
        }
      }
    } catch (error) {
      console.error('Error loading supplies:', error);
      setError('Error al cargar el inventario');
      
      // Si falla el servidor, usar filtrado local como respaldo
      if (!useLocalFiltering && allSupplies.length > 0) {
        setUseLocalFiltering(true);
        applyLocalFilters();
        toast.error('Usando filtrado local debido a problemas de conexión');
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadSupplies();
  }, []);
  
  // Efecto para aplicar filtros
  useEffect(() => {
    if (useLocalFiltering) {
      applyLocalFilters();
    } else {
      loadSupplies();
    }
  }, [filters, useLocalFiltering]);
  
  // Funciones de manejo
  const handleCreateSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Limpiar datos antes de enviar
      const cleanedData = {
        ...formData,
        expirationDate: formData.expirationDate || undefined
      };
      
      const response = await inventoryService.createSupply(cleanedData);
      if (response.success) {
        toast.success('Insumo creado exitosamente');
        setShowCreateModal(false);
        resetForm();
        loadSupplies(true); // Recargar todos los datos
      }
    } catch (error) {
      console.error('Error creating supply:', error);
      toast.error('Error al crear el insumo');
    }
  };
  
  const handleEditSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupply) return;
    
    try {
      // Limpiar datos antes de enviar
      const cleanedData = {
        ...formData,
        expirationDate: formData.expirationDate || undefined
      };
      
      const response = await inventoryService.updateSupply(selectedSupply.id, cleanedData);
      if (response.success) {
        toast.success('Insumo actualizado exitosamente');
        setShowEditModal(false);
        resetForm();
        loadSupplies(true); // Recargar todos los datos
      }
    } catch (error) {
      console.error('Error updating supply:', error);
      toast.error('Error al actualizar el insumo');
    }
  };
  
  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupply) return;
    
    try {
      const response = await inventoryService.updateStock(
        selectedSupply.id, 
        stockMovement.quantity, 
        stockMovement.type,
        stockMovement.reason,
        stockMovement.unitCost,
        stockMovement.reference
      );
      if (response.success) {
        toast.success(`Stock ${
          stockMovement.type === 'add' ? 'agregado' : 
          stockMovement.type === 'subtract' ? 'reducido' : 'ajustado'
        } exitosamente`);
        setShowStockModal(false);
        setStockMovement({ quantity: 0, type: 'add', reason: '', unitCost: undefined, reference: undefined });
        loadSupplies(true); // Recargar todos los datos
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar el stock');
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      unit: '',
      stock: 0,
      minStock: 0,
      maxStock: undefined,
      unitPrice: 0,
      supplier: '',
      expirationDate: ''
    });
    setSelectedSupply(null);
  };
  
  const openEditModal = (supply: ApiSupply) => {
    setSelectedSupply(supply);
    setFormData({
      name: supply.name,
      description: supply.description || '',
      category: supply.category,
      unit: supply.unit || '',
      stock: supply.stock,
      minStock: supply.minStock,
      maxStock: supply.maxStock || undefined,
      unitPrice: supply.unitPrice,
      supplier: supply.supplier || '',
      expirationDate: supply.expirationDate || ''
    });
    setShowEditModal(true);
  };
  
  const openStockModal = (supply: ApiSupply) => {
    setSelectedSupply(supply);
    setShowStockModal(true);
  };

  const openMovementsModal = async (supply: ApiSupply) => {
    setSelectedSupply(supply);
    setShowMovementsModal(true);
    await loadMovements(supply.id);
  };

  const loadMovements = async (supplyId: string) => {
    try {
      setMovementsLoading(true);
      const response = await inventoryService.getSupplyMovements(supplyId, { limit: 20 });
      if (response.success) {
        setMovements(response.data);
      }
    } catch (error) {
      console.error('Error loading movements:', error);
      toast.error('Error al cargar el historial de movimientos');
    } finally {
      setMovementsLoading(false);
    }
  };
  
  const getStockColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'text-red-600 bg-red-50';
      case 'low_stock': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="p-6">
      {/* Header Mejorado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-pink-800">📦 Gestión de Inventario</h1>
          <p className="text-gray-600 mt-1">Administra insumos, stock y movimientos de inventario</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setFilters({ search: '', category: '', status: '' });
              loadSupplies();
            }}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            🔄 Limpiar Filtros
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            📦 Nuevo Insumo
          </button>
        </div>
      </div>

      {/* Filtros Mejorados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">🔍 Filtros de Búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                🔍 Buscar Insumos
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre, descripción, categoría..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>

            {/* Filtro por categoría */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                📋 Categoría
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">📦 Todas las categorías</option>
                <option value="Limpieza">🧴 Limpieza</option>
                <option value="Desinfección">🧽 Desinfección</option>
                <option value="Material Médico">🩺 Material Médico</option>
                <option value="Cosmética">💄 Cosmética</option>
                <option value="Protección">🧿 Protección</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                📊 Estado de Stock
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">📋 Todos los estados</option>
                <option value="normal">✅ Stock Normal</option>
                <option value="low_stock">⚠️ Stock Bajo</option>
                <option value="out_of_stock">🚫 Sin Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Insumos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadSupplies()}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Reintentar
          </button>
        </div>
      ) : supplies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="text-gray-400 mb-3">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">
              No hay insumos registrados
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Crea el primer insumo para comenzar
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplies.map((supply) => {
            const status = getStockStatus(supply);
            return (
              <div key={supply.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
                {/* Header de la tarjeta con gradiente */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                        <span className="text-lg font-medium text-pink-700">
                          📦
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {supply.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Insumo #{supply.id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                        status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {status === 'out_of_stock' ? '🚫 Sin Stock' : 
                         status === 'low_stock' ? '⚠️ Stock Bajo' : '✅ Normal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información del insumo */}
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-pink-500">📋</span>
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {supply.category || 'Sin categoría'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-pink-500">📏</span>
                      <span className="text-sm text-gray-700">{supply.unit || 'Sin unidad'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-pink-500">📊</span>
                        <span className="text-sm text-gray-700">Stock: <span className="font-semibold">{supply.stock || 0}</span></span>
                      </div>
                      <span className="text-xs text-gray-500">Min: {supply.minStock || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-pink-500">💰</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${(Number(supply.unitPrice) || 0).toFixed(2)}
                      </span>
                    </div>
                    {supply.description && (
                      <div className="flex items-start space-x-2">
                        <span className="text-pink-500">📝</span>
                        <span className="text-sm text-gray-700 line-clamp-2">
                          {supply.description.length > 80 
                            ? `${supply.description.substring(0, 80)}...` 
                            : supply.description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="bg-white border-t border-gray-100 p-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openStockModal(supply)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                    >
                      📦 Stock
                    </button>
                    <button
                      onClick={() => openEditModal(supply)}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openMovementsModal(supply)}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      <ClockIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Insumo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pink-800">📦 Crear Nuevo Insumo</h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateSupply} className="p-6">
              <div className="space-y-6">
                {/* Sección Información Básica */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">📝 Información Básica</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Nombre del Insumo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                        placeholder="Ej: Alcohol Isopropílico 70%"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Descripción detallada del insumo, uso recomendado, características especiales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Clasificación */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">📊 Clasificación y Unidades</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Categoría <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Seleccionar categoría...</option>
                        <option value="Limpieza">🧴 Limpieza</option>
                        <option value="Desinfección">🧽 Desinfección</option>
                        <option value="Material Médico">🩺 Material Médico</option>
                        <option value="Cosmética">💄 Cosmética</option>
                        <option value="Protección">🧿 Protección</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Unidad de Medida <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Seleccionar unidad...</option>
                        <option value="unidad">Unidad (pcs)</option>
                        <option value="caja">Caja</option>
                        <option value="paquete">Paquete</option>
                        <option value="litro">Litro (L)</option>
                        <option value="ml">Mililitro (mL)</option>
                        <option value="kg">Kilogramo (kg)</option>
                        <option value="gr">Gramo (g)</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* Sección Inventario y Stock */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">📦 Inventario y Stock</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Stock Inicial <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        required
                        placeholder="0"
                      />
                      <p className="text-xs text-green-600 mt-1">Cantidad inicial en inventario</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Stock Mínimo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        required
                        placeholder="5"
                      />
                      <p className="text-xs text-green-600 mt-1">Alerta de stock bajo</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Stock Máximo
                      </label>
                      <input
                        type="number"
                        value={formData.maxStock || ''}
                        onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || undefined })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        placeholder="100"
                      />
                      <p className="text-xs text-green-600 mt-1">Límite máximo (opcional)</p>
                    </div>
                  </div>
                </div>

                {/* Sección Información Comercial */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-orange-800 mb-4">💰 Información Comercial</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Precio Unitario (USD) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        required
                        placeholder="0.00"
                      />
                      <p className="text-xs text-orange-600 mt-1">Precio por unidad de medida</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Proveedor
                      </label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Nombre del proveedor"
                      />
                      <p className="text-xs text-orange-600 mt-1">Empresa o distribuidor</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-orange-700 mb-1">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-orange-600 mt-1">Solo para productos perecederos (opcional)</p>
                  </div>
                </div>
              </div>
              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-pink-200 bg-pink-50 -mx-6 px-6 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  📦 Crear Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Insumo */}
      {showEditModal && selectedSupply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-pink-800">✏️ Editar Insumo</h2>
                <p className="text-sm text-gray-600 mt-1">Insumo: {selectedSupply.name}</p>
              </div>
              <button
                onClick={() => { setShowEditModal(false); resetForm(); }}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleEditSupply} className="p-6">
              <div className="space-y-6">
                {/* Sección Estado Actual */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">📊 Estado Actual del Insumo</h3>
                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedSupply.stock || 0}</div>
                        <div className="text-xs text-gray-600">stock actual</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{selectedSupply.minStock || 0}</div>
                        <div className="text-xs text-gray-600">stock mínimo</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">${(Number(selectedSupply.unitPrice) || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-600">precio actual</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-purple-600">{selectedSupply.category}</div>
                        <div className="text-xs text-gray-600">categoría</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección Información Básica */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">✏️ Información Básica</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Nombre del Insumo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                        placeholder="Ej: Alcohol Isopropílico 70%"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Descripción detallada del insumo, uso recomendado, características especiales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Clasificación */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">📊 Clasificación y Unidades</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Categoría <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Seleccionar categoría...</option>
                        <option value="Limpieza">🧴 Limpieza</option>
                        <option value="Desinfección">🧽 Desinfección</option>
                        <option value="Material Médico">🩺 Material Médico</option>
                        <option value="Cosmética">💄 Cosmética</option>
                        <option value="Protección">🧿 Protección</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Unidad de Medida <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Seleccionar unidad...</option>
                        <option value="unidad">Unidad (pcs)</option>
                        <option value="caja">Caja</option>
                        <option value="paquete">Paquete</option>
                        <option value="litro">Litro (L)</option>
                        <option value="ml">Mililitro (mL)</option>
                        <option value="kg">Kilogramo (kg)</option>
                        <option value="gr">Gramo (g)</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* Sección Configuración de Stock */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">📦 Configuración de Stock</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Stock Mínimo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        required
                        placeholder="5"
                      />
                      <p className="text-xs text-green-600 mt-1">Alerta de stock bajo</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Stock Máximo
                      </label>
                      <input
                        type="number"
                        value={formData.maxStock || ''}
                        onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || undefined })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        placeholder="100"
                      />
                      <p className="text-xs text-green-600 mt-1">Límite máximo (opcional)</p>
                    </div>
                  </div>
                </div>

                {/* Sección Información Comercial */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-orange-800 mb-4">💰 Información Comercial</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Precio Unitario (USD) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        required
                        placeholder="0.00"
                      />
                      <p className="text-xs text-orange-600 mt-1">Precio por unidad de medida</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Proveedor
                      </label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Nombre del proveedor"
                      />
                      <p className="text-xs text-orange-600 mt-1">Empresa o distribuidor</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-orange-700 mb-1">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-orange-600 mt-1">Solo para productos perecederos (opcional)</p>
                  </div>
                </div>
              </div>
              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-pink-200 bg-pink-50 -mx-6 px-6 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  ✏️ Actualizar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Movimiento de Stock */}
      {showStockModal && selectedSupply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-pink-800">📦 Movimiento de Stock</h2>
                <p className="text-sm text-gray-600 mt-1">Registrar entrada, salida o ajuste de inventario</p>
              </div>
              <button
                onClick={() => { 
                  setShowStockModal(false); 
                  setStockMovement({ quantity: 0, type: 'add', reason: '', unitCost: undefined, reference: undefined }); 
                }}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Información del producto */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <CubeIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{selectedSupply.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Stock actual:</span>
                        <span className="font-bold text-blue-600 text-lg">{selectedSupply.stock} {selectedSupply.unit}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Categoría:</span>
                        <span className="font-medium text-purple-600">{selectedSupply.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Stock mínimo:</span>
                        <span className="font-medium text-orange-600">{selectedSupply.minStock || 0} {selectedSupply.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleStockUpdate} className="p-6">
              <div className="space-y-6">
                {/* Sección Tipo de Movimiento */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">🔄 Tipo de Movimiento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setStockMovement({ ...stockMovement, type: 'add' })}
                      className={`p-4 text-sm font-medium rounded-lg border transition-all ${
                        stockMovement.type === 'add'
                          ? 'bg-green-100 border-green-300 text-green-800 ring-2 ring-green-500 ring-opacity-50'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-200'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-green-100 p-2 rounded-full">
                          <ArrowUpIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="font-semibold">Entrada</span>
                        <span className="text-xs text-center">Compras, reposición, devoluciones</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockMovement({ ...stockMovement, type: 'subtract' })}
                      className={`p-4 text-sm font-medium rounded-lg border transition-all ${
                        stockMovement.type === 'subtract'
                          ? 'bg-red-100 border-red-300 text-red-800 ring-2 ring-red-500 ring-opacity-50'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-200'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-red-100 p-2 rounded-full">
                          <ArrowDownIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <span className="font-semibold">Salida</span>
                        <span className="text-xs text-center">Uso en tratamientos, ventas, pérdidas</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockMovement({ ...stockMovement, type: 'adjust' })}
                      className={`p-4 text-sm font-medium rounded-lg border transition-all ${
                        stockMovement.type === 'adjust'
                          ? 'bg-blue-100 border-blue-300 text-blue-800 ring-2 ring-blue-500 ring-opacity-50'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <PencilIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-semibold">Ajuste</span>
                        <span className="text-xs text-center">Corrección de inventario</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sección Detalles del Movimiento */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">📊 Detalles del Movimiento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Cantidad ({selectedSupply.unit}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={stockMovement.quantity}
                        onChange={(e) => setStockMovement({ ...stockMovement, quantity: parseInt(e.target.value) || 0 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        required
                        placeholder="0"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        {stockMovement.type === 'add' && 'Cantidad a agregar al inventario'}
                        {stockMovement.type === 'subtract' && 'Cantidad a retirar del inventario'}
                        {stockMovement.type === 'adjust' && 'Nueva cantidad total (ajuste absoluto)'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Costo Unitario (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={stockMovement.unitCost || ''}
                        onChange={(e) => setStockMovement({ ...stockMovement, unitCost: parseFloat(e.target.value) || undefined })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-blue-600 mt-1">Solo para entradas (opcional)</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Referencia/Factura
                    </label>
                    <input
                      type="text"
                      value={stockMovement.reference || ''}
                      onChange={(e) => setStockMovement({ ...stockMovement, reference: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Factura #12345, Orden de compra #ABC123"
                    />
                    <p className="text-xs text-blue-600 mt-1">Número de factura, orden de compra u otra referencia</p>
                  </div>
                </div>

                {/* Sección Motivo */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-orange-800 mb-4">📝 Motivo del Movimiento</h3>
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-1">
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={stockMovement.reason}
                      onChange={(e) => setStockMovement({ ...stockMovement, reason: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={3}
                      placeholder={
                        stockMovement.type === 'add' 
                          ? 'Ej: Compra a proveedor XYZ, reposición mensual, devolución de cliente...'
                          : stockMovement.type === 'subtract'
                          ? 'Ej: Uso en tratamiento facial, venta directa, producto vencido, pérdida por rotura...'
                          : 'Ej: Corrección por inventario físico, ajuste por diferencia de sistema...'
                      }
                      required
                    />
                    <p className="text-xs text-orange-600 mt-1">Explique detalladamente el motivo de este movimiento</p>
                  </div>
                </div>
              </div>

              {/* Resumen del movimiento */}
              {stockMovement.quantity > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">📋 Resumen del Movimiento</h3>
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedSupply.stock}</div>
                        <div className="text-xs text-gray-600">Stock actual</div>
                        <div className="text-xs text-gray-500">{selectedSupply.unit}</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          stockMovement.type === 'add' ? 'text-green-600' : 
                          stockMovement.type === 'subtract' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {stockMovement.type === 'add' ? '+' : stockMovement.type === 'subtract' ? '-' : '='}
                          {stockMovement.quantity}
                        </div>
                        <div className="text-xs text-gray-600">
                          {stockMovement.type === 'add' ? 'Entrada' : 
                           stockMovement.type === 'subtract' ? 'Salida' : 'Ajuste'}
                        </div>
                        <div className="text-xs text-gray-500">{selectedSupply.unit}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {stockMovement.type === 'add' 
                            ? selectedSupply.stock + stockMovement.quantity 
                            : stockMovement.type === 'subtract'
                            ? selectedSupply.stock - stockMovement.quantity
                            : stockMovement.quantity
                          }
                        </div>
                        <div className="text-xs text-gray-600">Nuevo stock</div>
                        <div className="text-xs text-gray-500">{selectedSupply.unit}</div>
                      </div>
                    </div>
                    
                    {/* Información adicional */}
                    {stockMovement.unitCost && stockMovement.unitCost > 0 && (
                      <div className="mt-4 pt-4 border-t border-green-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Costo total:</span>
                          <span className="font-semibold text-green-600">
                            ${(stockMovement.unitCost * stockMovement.quantity).toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Alertas y validaciones */}
                    <div className="mt-4 space-y-2">
                      {/* Validación de stock insuficiente */}
                      {stockMovement.type === 'subtract' && stockMovement.quantity > selectedSupply.stock && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="text-red-500">⚠️</div>
                            <div>
                              <div className="text-sm font-medium text-red-800">Stock insuficiente</div>
                              <div className="text-xs text-red-600">
                                Disponible: {selectedSupply.stock} {selectedSupply.unit} | 
                                Solicitado: {stockMovement.quantity} {selectedSupply.unit}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Alerta de stock bajo */}
                      {stockMovement.type === 'subtract' && 
                       (selectedSupply.stock - stockMovement.quantity) <= (selectedSupply.minStock || 0) && 
                       stockMovement.quantity <= selectedSupply.stock && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="text-yellow-500">⚠️</div>
                            <div>
                              <div className="text-sm font-medium text-yellow-800">Alerta de stock bajo</div>
                              <div className="text-xs text-yellow-600">
                                El stock resultante ({selectedSupply.stock - stockMovement.quantity} {selectedSupply.unit}) 
                                será igual o menor al mínimo ({selectedSupply.minStock || 0} {selectedSupply.unit})
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-pink-200 bg-pink-50 -mx-6 px-6 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => { 
                    setShowStockModal(false); 
                    setStockMovement({ quantity: 0, type: 'add', reason: '', unitCost: undefined, reference: undefined }); 
                  }}
                  className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={stockMovement.type === 'subtract' && stockMovement.quantity > selectedSupply.stock}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📦 Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Movimientos */}
      {showMovementsModal && selectedSupply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-pink-800">📋 Historial de Movimientos</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedSupply.name}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span className="text-gray-500">Stock actual:</span>
                  <span className="font-bold text-blue-600 text-lg">{selectedSupply.stock} {selectedSupply.unit}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">Categoría:</span>
                  <span className="font-medium text-purple-600">{selectedSupply.category}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMovementsModal(false);
                  setMovements([]);
                  setSelectedSupply(null);
                }}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {movementsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando historial de movimientos...</p>
                  </div>
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <ClockIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sin movimientos registrados</h3>
                  <p className="text-gray-500">No hay movimientos de stock registrados para este insumo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Resumen estadístico */}
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-medium text-pink-800 mb-3">📊 Resumen de Actividad</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {movements.filter(m => m.type === 'add').length}
                        </div>
                        <div className="text-xs text-gray-600">Entradas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {movements.filter(m => m.type === 'subtract').length}
                        </div>
                        <div className="text-xs text-gray-600">Salidas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {movements.filter(m => m.type === 'adjust').length}
                        </div>
                        <div className="text-xs text-gray-600">Ajustes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {movements.length}
                        </div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de movimientos */}
                  <div className="space-y-3">
                    {movements.map((movement, index) => (
                      <div key={movement.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="p-4">
                          {/* Header del movimiento */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${
                                movement.type === 'add' ? 'bg-green-100' :
                                movement.type === 'subtract' ? 'bg-red-100' :
                                movement.type === 'adjust' ? 'bg-blue-100' : 'bg-yellow-100'
                              }`}>
                                {movement.type === 'add' && <ArrowUpIcon className="h-4 w-4 text-green-600" />}
                                {movement.type === 'subtract' && <ArrowDownIcon className="h-4 w-4 text-red-600" />}
                                {movement.type === 'adjust' && <PencilIcon className="h-4 w-4 text-blue-600" />}
                                {movement.type === 'expired' && <ClockIcon className="h-4 w-4 text-yellow-600" />}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                    movement.type === 'add' 
                                      ? 'bg-green-100 text-green-800' 
                                      : movement.type === 'subtract'
                                      ? 'bg-red-100 text-red-800'
                                      : movement.type === 'adjust'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {movement.typeLabel || (movement.type === 'add' ? 'Entrada' : movement.type === 'subtract' ? 'Salida' : movement.type === 'adjust' ? 'Ajuste' : 'Vencido')}
                                  </span>
                                  <span className={`text-lg font-bold ${
                                    movement.type === 'add' ? 'text-green-600' :
                                    movement.type === 'subtract' ? 'text-red-600' :
                                    movement.type === 'adjust' ? 'text-blue-600' : 'text-yellow-600'
                                  }`}>
                                    {movement.type === 'add' ? '+' : movement.type === 'subtract' ? '-' : movement.type === 'adjust' ? '±' : ''}{movement.quantity} {selectedSupply.unit}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Movimiento #{movements.length - index}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(movement.createdAt).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit', 
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(movement.createdAt).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Detalles del stock */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-600">{movement.previousStock}</div>
                                <div className="text-xs text-gray-500">Stock anterior</div>
                              </div>
                              <div className="text-center">
                                <div className={`text-lg font-bold ${
                                  movement.type === 'add' ? 'text-green-600' :
                                  movement.type === 'subtract' ? 'text-red-600' : 'text-blue-600'
                                }`}>
                                  {movement.type === 'add' ? '→' : movement.type === 'subtract' ? '→' : '→'}
                                </div>
                                <div className="text-xs text-gray-500">Cambio</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{movement.newStock}</div>
                                <div className="text-xs text-gray-500">Stock nuevo</div>
                              </div>
                            </div>
                          </div>

                          {/* Información adicional */}
                          <div className="space-y-2">
                            {movement.reason && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                  <div className="text-blue-600 mt-0.5">📝</div>
                                  <div>
                                    <div className="text-sm font-medium text-blue-800">Motivo</div>
                                    <p className="text-sm text-blue-700 mt-1">{movement.reason}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {movement.unitCost && !isNaN(Number(movement.unitCost)) && Number(movement.unitCost) > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="text-green-600">💰</div>
                                    <div>
                                      <div className="text-sm font-medium text-green-800">Costo</div>
                                      <div className="text-sm text-green-700">
                                        ${Number(movement.unitCost).toFixed(2)} por {selectedSupply.unit}
                                        {movement.quantity > 1 && (
                                          <span className="block text-xs">
                                            Total: ${(Number(movement.unitCost) * movement.quantity).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {movement.reference && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="text-orange-600">📎</div>
                                    <div>
                                      <div className="text-sm font-medium text-orange-800">Referencia</div>
                                      <div className="text-sm text-orange-700 font-mono">{movement.reference}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {movement.createdBy && (
                              <div className="flex items-center justify-end space-x-2 text-xs text-gray-500 mt-2">
                                <span>👤 Usuario:</span>
                                <span className="font-medium">{movement.createdBy}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-pink-200 bg-pink-50">
              <div className="text-sm text-gray-600">
                Mostrando {movements.length} movimiento{movements.length !== 1 ? 's' : ''} de stock
              </div>
              <button
                onClick={() => {
                  setShowMovementsModal(false);
                  setMovements([]);
                  setSelectedSupply(null);
                }}
                className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                📋 Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
