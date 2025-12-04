import api from './api';

export interface CompanySettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  logo?: string;
  taxId: string;
  currency: string;
  timezone: string;
  language: string;
  businessHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  notifications: {
    emailReminders: boolean;
    smsReminders: boolean;
    appointmentConfirmations: boolean;
  };
}

export interface UserSettings {
  id: string;
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  preferences: {
    dateFormat: string;
    timeFormat: '12h' | '24h';
    currency: string;
  };
}

class SettingsService {
  // Configuración de la empresa
  async getCompanySettings() {
    const response = await api.get('/settings/company');
    return response.data;
  }

  async updateCompanySettings(settings: Partial<CompanySettings>) {
    const response = await api.put('/settings/company', settings);
    return response.data;
  }

  async uploadCompanyLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/settings/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Configuración del usuario
  async getUserSettings() {
    const response = await api.get('/settings/user');
    return response.data;
  }

  async updateUserSettings(settings: Partial<UserSettings>) {
    const response = await api.put('/settings/user', settings);
    return response.data;
  }

  // Configuración de notificaciones
  async getNotificationSettings() {
    const response = await api.get('/settings/notifications');
    return response.data;
  }

  async updateNotificationSettings(settings: any) {
    const response = await api.put('/settings/notifications', settings);
    return response.data;
  }

  // Configuración de horarios de trabajo
  async getBusinessHours() {
    const response = await api.get('/settings/business-hours');
    return response.data;
  }

  async updateBusinessHours(hours: CompanySettings['businessHours']) {
    const response = await api.put('/settings/business-hours', hours);
    return response.data;
  }

  // Backup y restauración
  async createBackup() {
    const response = await api.post('/settings/backup');
    return response.data;
  }

  async getBackupHistory() {
    const response = await api.get('/settings/backup/history');
    return response.data;
  }

  async restoreBackup(backupId: string) {
    const response = await api.post(`/settings/backup/${backupId}/restore`);
    return response.data;
  }
}

export const settingsService = new SettingsService();
