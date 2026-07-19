import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { useClients } from '../hooks/useClients';
import { Client } from '../types';
import { Plus, Archive, Edit2 } from 'lucide-react';

export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, archiveClient } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    billingAddress: '',
    defaultCurrency: 'NGN',
    defaultPaymentTermsDays: 14,
    taxId: '',
    notes: '',
  });

  const handleReset = () => {
    setFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      billingAddress: '',
      defaultCurrency: 'NGN',
      defaultPaymentTermsDays: 14,
      taxId: '',
      notes: '',
    });
    setEditingId(null);
  };

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lower = searchTerm.toLowerCase();
    return clients.filter(
      c => c.name.toLowerCase().includes(lower) || 
           (c.email && c.email.toLowerCase().includes(lower)) ||
           (c.companyName && c.companyName.toLowerCase().includes(lower))
    );
  }, [clients, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert('Client name and email are required');
      return;
    }

    try {
      if (editingId) {
        await updateClient(editingId, {
          name: formData.name,
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          billingAddress: formData.billingAddress,
          defaultCurrency: formData.defaultCurrency,
          defaultPaymentTermsDays: Number(formData.defaultPaymentTermsDays),
          taxId: formData.taxId,
          notes: formData.notes,
        });
      } else {
        await addClient({
          name: formData.name,
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          billingAddress: formData.billingAddress,
          defaultCurrency: formData.defaultCurrency,
          defaultPaymentTermsDays: Number(formData.defaultPaymentTermsDays),
          taxId: formData.taxId,
          notes: formData.notes,
        });
      }

      handleReset();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
    }
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      companyName: client.companyName || '',
      email: client.email,
      phone: client.phone || '',
      billingAddress: client.billingAddress || '',
      defaultCurrency: client.defaultCurrency || 'NGN',
      defaultPaymentTermsDays: client.defaultPaymentTermsDays || 14,
      taxId: client.taxId || '',
      notes: client.notes || '',
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleArchive = async (id: string) => {
    if (window.confirm('Are you sure you want to archive this client? They will be hidden from default listings.')) {
      try {
        await archiveClient(id);
      } catch (error) {
        console.error('Error archiving client:', error);
        alert('Failed to archive client');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Client Directory</h1>
          <p className="text-slate-400 text-sm">Add, update, and manage billing profiles</p>
        </div>
        <Button
          onClick={() => {
            handleReset();
            setShowForm(!showForm);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white"
        >
          Add Client
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-slate-900 border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">
            {editingId ? 'Edit Client Profile' : 'Create Client Profile'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Client Name (Required)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Chinua Achebe"
                required
              />
              <Input
                label="Company Name (Optional)"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Glo Telecom"
              />
              <Input
                label="Email Address (Required)"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. client@domain.com"
                required
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +234 803 123 4567"
              />
              <Select
                label="Default Invoice Currency"
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                options={[
                  { value: 'NGN', label: 'NGN (₦)' },
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GHS', label: 'GHS (₵)' },
                  { value: 'KES', label: 'KES (KSh)' },
                ]}
              />
              <Input
                label="Default Payment Terms (Days)"
                type="number"
                value={formData.defaultPaymentTermsDays.toString()}
                onChange={(e) => setFormData({ ...formData, defaultPaymentTermsDays: Number(e.target.value) })}
              />
              <Input
                label="Tax Identification / VAT ID"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Tax Reference"
              />
            </div>

            <Input
              label="Billing Address"
              value={formData.billingAddress}
              onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              placeholder="Full street and state address"
            />

            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Prefers payments via bank transfer"
            />

            <div className="flex flex-col gap-2 sm:flex-row pt-2">
              <Button type="submit" className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white">
                {editingId ? 'Update Client' : 'Add Client'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  handleReset();
                }}
                className="w-full sm:w-auto bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search */}
      <Card className="bg-slate-900 border border-slate-800">
        <Input
          label="Search Ledger Clients"
          placeholder="Filter by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Card key={client.id} className="relative bg-slate-900 border border-slate-800 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white pr-3 break-words font-display">{client.name}</h3>
                  {client.companyName && <p className="text-xs text-slate-400 font-semibold">{client.companyName}</p>}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="text-yellow-500 hover:text-yellow-400"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleArchive(client.id)}
                    className="text-slate-400 hover:text-red-400"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-300 pt-1 border-t border-slate-800">
                {client.email && (
                  <p className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <a href={`mailto:${client.email}`} className="text-brand-400 hover:underline break-all">
                      {client.email}
                    </a>
                  </p>
                )}
                {client.phone && (
                  <p className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span>{client.phone}</span>
                  </p>
                )}
                {client.defaultCurrency && (
                  <p className="flex justify-between">
                    <span className="text-slate-500">Currency:</span>
                    <span className="font-semibold text-slate-200">{client.defaultCurrency}</span>
                  </p>
                )}
                {client.defaultPaymentTermsDays && (
                  <p className="flex justify-between">
                    <span className="text-slate-500">Terms:</span>
                    <span>{client.defaultPaymentTermsDays} Days</span>
                  </p>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full bg-slate-900 border border-slate-800">
            <p className="text-slate-500 text-center py-12">
              {searchTerm ? 'No matches found.' : 'No active clients. Add one to get started.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
export default Clients;
