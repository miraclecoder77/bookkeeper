import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { useSettings } from '../hooks/useSettings';
import { BusinessSettings } from '../types';
import { Save, Upload } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, loading, updateSettings } = useSettings();
  const [formData, setFormData] = useState<Partial<BusinessSettings>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateSettings({
        id: formData.id || 'default',
        name: formData.name || '',
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        taxId: formData.taxId,
        logo: formData.logo,
        currency: formData.currency || 'USD',
        taxRate: formData.taxRate,
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          logo: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your business information</p>
      </div>

      {/* Business Information */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Business Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your business name"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="business@example.com"
            />
            <Input
              label="Phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+234 123 456 7890"
            />
            <Select
              label="Currency"
              value={formData.currency || 'USD'}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              options={[
                { value: 'NGN', label: 'NGN (₦)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'CAD', label: 'CAD (C$)' },
                { value: 'AUD', label: 'AUD (A$)' },
                { value: 'JPY', label: 'JPY (¥)' },
              ]}
            />
          </div>

          <Input
            label="Address"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main St, Anytown"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tax ID (Optional)"
              value={formData.taxId || ''}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              placeholder="12-3456789"
            />
            <Input
              label="Tax Rate (%) (Optional)"
              type="number"
              step="0.01"
              value={formData.taxRate || ''}
              onChange={(e) => setFormData({ ...formData, taxRate: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0"
            />
          </div>

          <Button
            type="submit"
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Save Settings
          </Button>
        </form>
      </Card>

      {/* Logo */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Business Logo</h2>
        <div className="space-y-4">
          {formData.logo && (
            <div className="flex justify-center">
              <img src={formData.logo} alt="Logo" className="max-w-xs max-h-40 object-contain" />
            </div>
          )}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-600 font-medium">Click to upload logo</span>
              <span className="text-gray-500 text-sm">PNG, JPG, SVG up to 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
          {formData.logo && (
            <Button
              type="button"
              variant="danger"
              onClick={() => setFormData({ ...formData, logo: undefined })}
              className="w-full sm:w-auto"
            >
              Remove Logo
            </Button>
          )}
        </div>
      </Card>

      {/* About App */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">About Bookkeeper</h2>
        <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
          <p>
            <strong>Version:</strong> 1.0.0
          </p>
          <p>
            <strong>Storage:</strong> All your data is stored locally on your device in IndexedDB and automatically synced to your Google Drive.
          </p>
          <p>
            <strong>Privacy:</strong> Your data is only synced to your own Google Drive. We do not store any of your information on our servers.
          </p>
          <p>
            <strong>Data Access:</strong> We only access files in the "BookkeeperApp" folder in your Google Drive.
          </p>
        </div>
      </Card>
    </div>
  );
};
