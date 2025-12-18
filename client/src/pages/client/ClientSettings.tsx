import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number | null;
  gender: string;
  address: string;
  emergencyContact: string;
  medicalConditions: string;
  allergies: string;
}

const ClientSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [clientData, setClientData] = useState<ClientData>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    age: null,
    gender: '',
    address: '',
    emergencyContact: '',
    medicalConditions: '',
    allergies: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [user]);

  const loadClientData = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        toast.error('No se encontró información del usuario');
        return;
      }

      console.log('🔍 [FRONTEND] Cargando datos del cliente para userId:', user.id);

      // Primero intentar obtener datos del cliente por userId
      const clientResponse = await fetch(`/api/clients?userId=${user.id}`);
      
      console.log('🌐 [FRONTEND] Status de respuesta:', clientResponse.status);
      console.log('🌐 [FRONTEND] Headers:', clientResponse.headers.get('content-type'));
      
      if (!clientResponse.ok) {
        throw new Error(`HTTP error! status: ${clientResponse.status}`);
      }
      
      const responseText = await clientResponse.text();
      console.log('📄 [FRONTEND] Respuesta raw:', responseText.substring(0, 200));
      
      let clientData;
      try {
        clientData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [FRONTEND] Error parsing JSON:', parseError);
        console.error('📄 [FRONTEND] Respuesta completa:', responseText);
        throw new Error('El servidor devolvió una respuesta inválida');
      }
      
      console.log('📋 [FRONTEND] Respuesta de clientes:', clientData);

      if (clientData.success && clientData.data.length > 0) {
        const client = clientData.data[0];
        console.log('✅ [FRONTEND] Cliente encontrado:', client);
        
        setClientData({
          id: client.id,
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          email: client.email || '',
          phone: client.phone || '',
          dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
          age: client.age || null,
          gender: client.gender || '',
          address: client.address || '',
          emergencyContact: client.emergencyContact || '',
          medicalConditions: client.medicalConditions || '',
          allergies: client.allergies || ''
        });
      } else {
        console.log('⚠️ [FRONTEND] No se encontró cliente, usando datos del usuario');
        // Si no hay cliente, usar datos del usuario
        setClientData({
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          dateOfBirth: '',
          age: null,
          gender: '',
          address: '',
          emergencyContact: '',
          medicalConditions: '',
          allergies: ''
        });
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error al cargar datos del cliente:', error);
      toast.error('Error al cargar la información del perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ClientData, value: string | number | null) => {
    setClientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientData.firstName.trim() || !clientData.lastName.trim() || !clientData.email.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setIsSaving(true);

      // Actualizar datos del cliente usando el endpoint de clientes
      const response = await fetch(`/api/clients/${clientData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone,
          dateOfBirth: clientData.dateOfBirth,
          age: clientData.age,
          gender: clientData.gender,
          address: clientData.address,
          emergencyContact: clientData.emergencyContact,
          medicalConditions: clientData.medicalConditions,
          allergies: clientData.allergies
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar el contexto de usuario
        if (updateUser) {
          updateUser({
            ...user!,
            firstName: clientData.firstName,
            lastName: clientData.lastName,
            email: clientData.email,
            phone: clientData.phone
          });
        }
        
        toast.success('Perfil actualizado exitosamente');
      } else {
        throw new Error(data.message || 'Error al actualizar el perfil');
      }
    } catch (error: any) {
      console.error('Error al guardar:', error);
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
            <span className="text-2xl font-medium text-pink-700">
              {clientData.firstName && clientData.lastName 
                ? `${clientData.firstName.charAt(0)}${clientData.lastName.charAt(0)}`
                : '👤'
              }
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pink-800">⚙️ Mi Perfil</h1>
            <p className="text-sm text-gray-600 mt-1">
              Actualiza tu información personal y configuración de cuenta
            </p>
          </div>
        </div>
      </div>

      {/* Formulario de Perfil */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            👤 Información Personal
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Actualiza tu información de contacto y datos personales
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 Nombre *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={clientData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 Apellido *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={clientData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Tu apellido"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📧 Correo Electrónico *
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={clientData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📱 Teléfono
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={clientData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="+58 414 123 4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={clientData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎂 Edad
              </label>
              <input
                type="number"
                value={clientData.age || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('age', value ? parseInt(value) : null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Edad en años"
                min="0"
                max="120"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👥 Género
            </label>
            <select
              value={clientData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="">Seleccionar género</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏠 Dirección
            </label>
            <textarea
              value={clientData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Tu dirección completa"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🚨 Contacto de Emergencia
            </label>
            <input
              type="text"
              value={clientData.emergencyContact}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Nombre y teléfono del contacto de emergencia"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏥 Condiciones Médicas
            </label>
            <textarea
              value={clientData.medicalConditions}
              onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Condiciones médicas relevantes (diabetes, hipertensión, etc.)"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⚠️ Alergias
            </label>
            <textarea
              value={clientData.allergies}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Alergias conocidas (medicamentos, alimentos, etc.)"
              rows={3}
            />
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-500 mt-0.5">ℹ️</div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Información importante</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Los campos marcados con (*) son obligatorios</p>
                  <p>• Tu email se usa para iniciar sesión en el sistema</p>
                  <p>• El teléfono es opcional pero recomendado para contacto</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-6 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  💾 Guardando...
                </>
              ) : (
                <>💾 Guardar Cambios</>
              )}
            </button>
          </div>
        </form>
      </div>

        </div>
  );
};

export default ClientSettings;
