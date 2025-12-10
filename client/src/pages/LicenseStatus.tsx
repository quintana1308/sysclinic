import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ExclamationTriangleIcon, 
  ClockIcon, 
  XCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import licenseService, { LicenseStatus as LicenseStatusData } from '../services/licenseService';
import toast from 'react-hot-toast';

interface LicenseInfo {
  id?: string;
  licenseKey?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  companyName?: string;
  licenseName?: string;
  licenseType?: string;
  daysRemaining?: number;
}

interface LicenseStatusProps {
  code?: string;
  message?: string;
  licenseInfo?: LicenseInfo;
}

const LicenseStatus: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [statusData, setStatusData] = useState<LicenseStatusProps>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<LicenseStatusData | null>(null);

  const loadLicenseStatus = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando información adicional de licencia...');
      
      const licenseStatus = await licenseService.getCurrentLicenseStatus();
      console.log('✅ Información de licencia cargada:', licenseStatus);
      
      setApiData(licenseStatus);
      
      // Si no hay datos previos, usar los datos del API
      if (!statusData.code && !licenseStatus.isValid) {
        setStatusData({
          code: licenseStatus.reason || 'LICENSE_ERROR',
          message: 'Problema con la licencia de su empresa',
          licenseInfo: licenseStatus.licenseInfo
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error cargando estado de licencia:', error);
      // Si hay error de autenticación, redirigir al login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/', { replace: true });
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Obtener datos del estado de la navegación o localStorage
    const state = location.state as LicenseStatusProps;
    const storedData = localStorage.getItem('licenseStatusData');
    
    if (state) {
      setStatusData(state);
    } else if (storedData) {
      try {
        setStatusData(JSON.parse(storedData));
        localStorage.removeItem('licenseStatusData'); // Limpiar después de usar
      } catch (error) {
        console.error('Error parsing license status data:', error);
      }
    }

    // Cargar información adicional del API
    loadLicenseStatus();
  }, [location]);

  const getStatusConfig = () => {
    const { code, message, licenseInfo } = statusData;

    switch (code) {
      case 'LICENSE_EXPIRED':
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: '🔒 Licencia Vencida',
          subtitle: 'Su licencia ha expirado',
          description: message || 'La licencia de su empresa ha vencido y necesita ser renovada.',
          actionText: 'Renovar Licencia',
          showLicenseDetails: true
        };
      case 'NO_LICENSE':
        return {
          icon: XCircleIcon,
          iconColor: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: '🚫 Sin Licencia Activa',
          subtitle: 'Su empresa no tiene una licencia',
          description: message || 'Su empresa necesita una licencia activa para acceder al sistema.',
          actionText: 'Contactar Administrador',
          showLicenseDetails: false
        };
      case 'LICENSE_NOT_STARTED':
        return {
          icon: ClockIcon,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: '⏳ Licencia Pendiente',
          subtitle: 'Su licencia aún no ha iniciado',
          description: message || 'La licencia de su empresa tiene una fecha de inicio futura.',
          actionText: 'Ver Detalles',
          showLicenseDetails: true
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: '⚠️ Problema con Licencia',
          subtitle: 'Error en la verificación',
          description: message || 'Hay un problema con la licencia de su empresa.',
          actionText: 'Contactar Soporte',
          showLicenseDetails: false
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilStart = () => {
    if (!statusData.licenseInfo?.startDate) return null;
    const startDate = new Date(statusData.licenseInfo.startDate);
    const today = new Date();
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getDaysExpired = () => {
    if (!statusData.licenseInfo?.endDate) return null;
    const endDate = new Date(statusData.licenseInfo.endDate);
    const today = new Date();
    const diffTime = today.getTime() - endDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleBackToLogin = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Tarjeta Principal */}
        <div className={`bg-white rounded-xl shadow-lg border-2 ${config.borderColor} overflow-hidden`}>
          {/* Header */}
          <div className={`${config.bgColor} px-6 py-8 text-center border-b ${config.borderColor}`}>
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full bg-white shadow-md`}>
                <IconComponent className={`h-12 w-12 ${config.iconColor}`} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {config.title}
            </h1>
            <p className="text-lg text-gray-600">
              {config.subtitle}
            </p>
          </div>

          {/* Contenido */}
          <div className="px-6 py-8">
            {/* Descripción */}
            <div className="mb-8">
              <p className="text-gray-700 text-center leading-relaxed">
                {config.description}
              </p>
            </div>

            {/* Información de la Empresa */}
            {(statusData.licenseInfo?.companyName || apiData?.companyInfo?.name) && (
              <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <BuildingOfficeIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-900">Información de la Empresa</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-blue-800">
                    <span className="font-medium">Empresa:</span> {statusData.licenseInfo?.companyName || apiData?.companyInfo?.name}
                  </p>
                  {apiData?.companyInfo?.email && (
                    <p className="text-blue-800">
                      <span className="font-medium">Email:</span> {apiData.companyInfo.email}
                    </p>
                  )}
                  {apiData?.companyInfo?.phone && (
                    <p className="text-blue-800">
                      <span className="font-medium">Teléfono:</span> {apiData.companyInfo.phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Detalles de la Licencia */}
            {config.showLicenseDetails && statusData.licenseInfo && (
              <div className="mb-8 space-y-4">
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Detalles de la Licencia</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de Licencia */}
                  {statusData.licenseInfo.licenseName && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Plan</p>
                      <p className="font-medium text-gray-900">
                        {statusData.licenseInfo.licenseName}
                      </p>
                    </div>
                  )}

                  {/* Clave de Licencia */}
                  {statusData.licenseInfo.licenseKey && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Clave</p>
                      <p className="font-mono text-sm text-gray-900">
                        {statusData.licenseInfo.licenseKey}
                      </p>
                    </div>
                  )}

                  {/* Fecha de Inicio */}
                  {statusData.licenseInfo.startDate && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Fecha de Inicio</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(statusData.licenseInfo.startDate)}
                      </p>
                    </div>
                  )}

                  {/* Fecha de Vencimiento */}
                  {statusData.licenseInfo.endDate && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(statusData.licenseInfo.endDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Información Adicional según el Estado */}
                {statusData.code === 'LICENSE_EXPIRED' && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center mb-2">
                      <CalendarIcon className="h-5 w-5 text-red-600 mr-2" />
                      <span className="font-medium text-red-900">Estado de Vencimiento</span>
                    </div>
                    <p className="text-red-800">
                      Su licencia venció hace <span className="font-bold">{getDaysExpired()} días</span>
                    </p>
                  </div>
                )}

                {statusData.code === 'LICENSE_NOT_STARTED' && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center mb-2">
                      <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-900">Tiempo Restante</span>
                    </div>
                    <p className="text-yellow-800">
                      Su licencia iniciará en <span className="font-bold">{getDaysUntilStart()} días</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Información de Contacto */}
            <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3">¿Necesita Ayuda?</h3>
              <div className="space-y-2">
                <div className="flex items-center text-green-800">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">soporte@sysclinic.com</span>
                </div>
                <div className="flex items-center text-green-800">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">+57 (1) 234-5678</span>
                </div>
              </div>
              <p className="text-sm text-green-700 mt-3">
                Nuestro equipo de soporte está disponible para ayudarle con la renovación o activación de su licencia.
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBackToLogin}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver al Login
              </button>
              
              <button
                onClick={loadLicenseStatus}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Actualizar
                  </>
                )}
              </button>
              
              <button
                onClick={() => window.location.href = 'mailto:soporte@sysclinic.com?subject=Problema con Licencia'}
                className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors ${
                  statusData.code === 'LICENSE_EXPIRED' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : statusData.code === 'LICENSE_NOT_STARTED'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {config.actionText}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            SysClinic - Sistema de Gestión Clínica
          </p>
        </div>
      </div>
    </div>
  );
};

export default LicenseStatus;
