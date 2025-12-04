import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Company } from '../services/authService';

// Iconos SVG
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const BuildingOfficeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15l-.75 18h-13.5L4.5 3zM7.5 6h9M7.5 9h9M7.5 12h9" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

interface CompanySelectorProps {
  className?: string;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ className = '' }) => {
  const { user, isMaster, switchCompany, getAvailableCompanies, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [switchingCompany, setSwitchingCompany] = useState<string | null>(null);

  const isMasterUser = isMaster();

  // Cargar empresas disponibles
  useEffect(() => {
    if (!isMasterUser) return;

    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const availableCompanies = await getAvailableCompanies();
        setCompanies(availableCompanies);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    if (isOpen && companies.length === 0) {
      loadCompanies();
    }
  }, [isOpen, getAvailableCompanies, companies.length, isMasterUser]);

  // Solo mostrar para usuarios master
  if (!isMasterUser) {
    return null;
  }

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === user?.companies?.current?.id) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitchingCompany(companyId);
      await switchCompany(companyId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error al cambiar empresa:', error);
    } finally {
      setSwitchingCompany(null);
    }
  };

  const currentCompany = user?.companies?.current;

  return (
    <div className={`relative ${className}`}>
      {/* Botón selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || loadingCompanies}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <BuildingOfficeIcon className="h-4 w-4" />
        <span className="max-w-32 truncate">
          {currentCompany?.name || 'Seleccionar empresa'}
        </span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              {/* Header */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Cambiar empresa</p>
                <p className="text-xs text-gray-500">Selecciona una empresa para gestionar</p>
              </div>

              {/* Loading */}
              {loadingCompanies && (
                <div className="px-4 py-3 text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-xs text-gray-500 mt-2">Cargando empresas...</p>
                </div>
              )}

              {/* Lista de empresas */}
              {!loadingCompanies && companies.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  {companies.map((company) => {
                    const isCurrentCompany = company.id === currentCompany?.id;
                    const isSwitching = switchingCompany === company.id;
                    
                    return (
                      <button
                        key={company.id}
                        onClick={() => handleSwitchCompany(company.id)}
                        disabled={isSwitching}
                        className={`
                          w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50
                          ${isCurrentCompany ? 'bg-primary-50 text-primary-700' : 'text-gray-900'}
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium
                            ${isCurrentCompany ? 'bg-primary-600' : 'bg-gray-400'}
                          `}>
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{company.name}</p>
                            <p className="text-xs text-gray-500">{company.slug}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          {isSwitching && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                          )}
                          {isCurrentCompany && !isSwitching && (
                            <CheckIcon className="h-4 w-4 text-primary-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sin empresas */}
              {!loadingCompanies && companies.length === 0 && (
                <div className="px-4 py-3 text-center">
                  <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay empresas disponibles</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-100 px-4 py-2">
                <p className="text-xs text-gray-400">
                  Empresa actual: {currentCompany?.name || 'Ninguna'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompanySelector;
