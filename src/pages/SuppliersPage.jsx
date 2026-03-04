import React, { useState, Fragment } from 'react';
import { useApp } from '../context/AppContext';
import {
    SectionHeader,
    DataTable,
    Modal,
    FormField,
    FormRow,
    Icon,
    EmptyState
} from '../components/ui';

export const SuppliersPage = () => {
    const { data: MOCK, addSupplier, updateSupplier } = useApp();
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', phone: '', email: '', cuit: '', address: '' });

    const filtered = MOCK.suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contact.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = () => {
        if (!newSupplier.name) {
            alert('El nombre es obligatorio');
            return;
        }
        if (editingSupplier) {
            updateSupplier(editingSupplier.id, newSupplier);
        } else {
            addSupplier(newSupplier);
        }
        setShowNew(false);
        setEditingSupplier(null);
        setNewSupplier({ name: '', contact: '', phone: '', email: '', cuit: '', address: '' });
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setNewSupplier({ ...supplier });
        setShowNew(true);
    };

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 250 }}>
                        <div className="search-bar">
                            <Icon name="search" size={18} />
                            <input type="text" placeholder="Buscar proveedores..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowNew(true)}>
                        <Icon name="add" size={18} /> Nuevo Proveedor
                    </button>
                </div>

                <DataTable
                    columns={[
                        { key: 'name', label: 'Proveedor', render: r => <strong>{r.name}</strong> },
                        { key: 'contact', label: 'Contacto' },
                        { key: 'phone', label: 'Teléfono' },
                        { key: 'email', label: 'Email' },
                        { key: 'cuit', label: 'CUIT', render: r => r.cuit || '—' },
                        {
                            key: 'actions',
                            label: '',
                            render: r => (
                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(r)}>
                                    <Icon name="edit" size={16} />
                                </button>
                            )
                        }
                    ]}
                    data={filtered}
                />

                {filtered.length === 0 && <EmptyState icon="business" title="No se encontraron proveedores" sub="Probá con otro término de búsqueda o agregá uno nuevo." />}

                {showNew && (
                    <Modal
                        title={editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
                        onClose={() => { setShowNew(false); setEditingSupplier(null); }}
                        footer={
                            <Fragment>
                                <button className="btn btn-ghost" onClick={() => { setShowNew(false); setEditingSupplier(null); }}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
                            </Fragment>
                        }
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormField label="Nombre de la Empresa">
                                <input className="form-input" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} placeholder="Ej: Distribuidora Lubricantes S.A." />
                            </FormField>
                            <FormRow>
                                <FormField label="Contacto Responsable">
                                    <input className="form-input" value={newSupplier.contact} onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })} placeholder="Nombre de la persona" />
                                </FormField>
                                <FormField label="CUIT">
                                    <input className="form-input" value={newSupplier.cuit} onChange={e => setNewSupplier({ ...newSupplier, cuit: e.target.value })} placeholder="XX-XXXXXXXX-X" />
                                </FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Teléfono">
                                    <input className="form-input" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} placeholder="+54 223 ..." />
                                </FormField>
                                <FormField label="Email">
                                    <input className="form-input" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} placeholder="proveedor@empresa.com" />
                                </FormField>
                            </FormRow>
                            <FormField label="Dirección / Localidad">
                                <input className="form-input" value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} placeholder="Calle, Nivel, Ciudad" />
                            </FormField>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};
