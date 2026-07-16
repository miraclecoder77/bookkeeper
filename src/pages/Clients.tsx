import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useClients } from '../hooks/useClients';
import { Client } from '../types';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, searchClients } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    taxId: '',
  });

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return searchClients(searchTerm);
  }, [clients, searchTerm, searchClients]);

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      address: '',
      phone: '',
      taxId: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert('Please fill in at least name and email');
      return;
    }

    try {
      if (editingId) {
        await updateClient({
          id: editingId,
          ...formData,
        });
        setEditingId(null);
      } else {
        await addClient(formData);
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
      email: client.email,
      address: client.address,
      phone: client.phone || '',
      taxId: client.taxId || '',
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(id);
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your client information</p>
        </div>
        <Button
          onClick={() => {
            handleReset();
            setShowForm(!showForm);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Add Client
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            {editingId ? 'Edit Client' : 'Add New Client'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Client Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="client name"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@example.com"
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+234 123 456 7890"
              />
              <Input
                label="Tax ID"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="12-3456789"
              />
            </div>

            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, Anytown"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="w-full sm:w-auto">{editingId ? 'Update Client' : 'Add Client'}</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  handleReset();
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search */}
      <Card>
        <Input
          label="Search Clients"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Card key={client.id} className="relative">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 pr-3 break-words">{client.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {client.email && (
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <a href={`mailto:${client.email}`} className="text-blue-600 dark:text-blue-400 ml-1 hover:underline break-all">
                      {client.email}
                    </a>
                  </p>
                )}
                {client.phone && (
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <a href={`tel:${client.phone}`} className="text-blue-600 dark:text-blue-400 ml-1 hover:underline">
                      {client.phone}
                    </a>
                  </p>
                )}
                {client.address && (
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Address:</span>
                    <span className="text-gray-900 dark:text-gray-100 ml-1 break-words">{client.address}</span>
                  </p>
                )}
                {client.taxId && (
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Tax ID:</span>
                    <span className="text-gray-900 dark:text-gray-100 ml-1">{client.taxId}</span>
                  </p>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <p className="text-gray-500 text-center py-12">
              {searchTerm ? 'No clients found. Try a different search.' : 'No clients yet. Add one to get started!'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
