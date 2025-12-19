import React from 'react';

const Footer: React.FC = () => {
  // Mensaje personalizado para WhatsApp
  const generateWhatsAppMessage = () => {
    const currentDate = new Date().toLocaleDateString('es-VE');
    const message = `🚀 *Consulta sobre SysClinic*

¡Hola Ing. Anthony Quintana! 👋

Me pongo en contacto contigo desde el sistema *SysClinic* que desarrollaste.

📋 *Motivo de contacto:*
• Consulta técnica sobre el sistema
• Solicitud de soporte
• Propuesta de mejora
• Otro: _______________

💻 *Información del sistema:*
• Sistema: SysClinic - Gestión de Clínicas
• Desarrollador: Ing. Anthony Quintana
• Fecha de contacto: ${currentDate}

¡Gracias por crear esta excelente herramienta! 🙌

_Mensaje generado automáticamente desde SysClinic_`;

    return encodeURIComponent(message);
  };

  const handleContactDeveloper = () => {
    const whatsappMessage = generateWhatsAppMessage();
    // Enlace personalizado de WhatsApp del Ing. Anthony Quintana
    const whatsappUrl = `https://wa.link/xzlwzt?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <footer className="fixed bottom-0 left-0 lg:left-64 right-0 bg-gradient-to-r from-pink-50 to-purple-50 border-t border-gray-200 py-2 px-4 lg:py-4 lg:px-6 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-1 sm:space-y-0">
        {/* Información del desarrollador */}
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
          <span>💻</span>
          <span>Desarrollado por</span>
          <button
            onClick={handleContactDeveloper}
            className="font-medium text-pink-600 hover:text-pink-700 transition-colors duration-200 hover:underline"
            title="Contactar al desarrollador por WhatsApp"
          >
            Ing. Anthony Quintana
          </button>
        </div>

        {/* Información adicional */}
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <span>🏥</span>
            <span>SysClinic v1.0</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>📅</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
