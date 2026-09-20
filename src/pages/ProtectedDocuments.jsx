import React, { useEffect, useState } from 'react';
import {
    FileText,
    ShieldCheck,
    ShieldOff,
    Plus,
    RefreshCw,
    Search,
    Lock,
    AlertTriangle,
    Database,
    CheckCircle2,
    XCircle,
    Trash2,
    Edit3,
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { emergencyAccessService } from '../services/emergencyAccess';

export function ProtectedDocuments() {
    const { role } = useAuth();

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDocument, setEditingDocument] = useState(null);

    const [form, setForm] = useState({
        name: '',
        description: '',
        sensitivity_level: 'high',
        break_glass_enabled: false,
        storage_path: '',
        document_type: 'PDF',
    });

    const isAdmin = ['admin', 'operator'].includes(role);

    // ------------------------------------------------------------
    // LOAD DOCUMENTS
    // ------------------------------------------------------------

    const loadDocuments = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const data = await emergencyAccessService.getAllProtectedResources();

            setDocuments(data || []);
        } catch (err) {
            console.error('Failed to load protected documents:', err);
            setError(err.message || 'Failed to load protected documents.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    // ------------------------------------------------------------
    // FORM
    // ------------------------------------------------------------

    const resetForm = () => {
        setForm({
            name: '',
            description: '',
            sensitivity_level: 'high',
            break_glass_enabled: false,
            storage_path: '',
            document_type: 'PDF',
        });

        setEditingDocument(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowAddModal(true);
        setError('');
        setSuccess('');
    };

    const openEditModal = (document) => {
        setEditingDocument(document);

        setForm({
            name: document.name || '',
            description: document.description || '',
            sensitivity_level: document.sensitivity_level || 'high',
            break_glass_enabled: Boolean(document.break_glass_enabled),
            storage_path: document.storage_path || '',
            document_type: document.document_type || 'PDF',
        });

        setShowAddModal(true);
        setError('');
        setSuccess('');
    };

    // ------------------------------------------------------------
    // SAVE DOCUMENT
    // ------------------------------------------------------------

    const handleSave = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            setError('Document name is required.');
            return;
        }

        if (!form.description.trim()) {
            setError('Document description is required.');
            return;
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            if (editingDocument) {
                await emergencyAccessService.updateProtectedResource(
                    editingDocument.id,
                    form
                );

                setSuccess('Protected document updated successfully.');
            } else {
                await emergencyAccessService.createProtectedResource(form);

                setSuccess('Protected document added successfully.');
            }

            setShowAddModal(false);
            resetForm();

            await loadDocuments();
        } catch (err) {
            console.error('Failed to save protected document:', err);

            setError(
                err.message || 'Failed to save protected document.'
            );
        } finally {
            setSaving(false);
        }
    };

    // ------------------------------------------------------------
    // TOGGLE BREAK-GLASS ACCESS
    // ------------------------------------------------------------

    const toggleBreakGlass = async (document) => {
        try {
            setError('');
            setSuccess('');

            await emergencyAccessService.setBreakGlassEligibility(
                document.id,
                !document.break_glass_enabled
            );

            setSuccess(
                !document.break_glass_enabled
                    ? `"${document.name}" is now available for emergency access.`
                    : `"${document.name}" has been removed from emergency access.`
            );

            await loadDocuments();
        } catch (err) {
            console.error('Failed to update eligibility:', err);

            setError(
                err.message ||
                'Failed to update break-glass eligibility.'
            );
        }
    };

    // ------------------------------------------------------------
    // DELETE DOCUMENT
    // ------------------------------------------------------------

    const handleDelete = async (document) => {
        const confirmed = window.confirm(
            `Delete "${document.name}" from the protected document registry?\n\nThis does not necessarily delete the physical file from storage.`
        );

        if (!confirmed) return;

        try {
            setError('');
            setSuccess('');

            await emergencyAccessService.deleteProtectedResource(
                document.id
            );

            setSuccess('Document removed from the protected registry.');

            await loadDocuments();
        } catch (err) {
            console.error('Failed to delete document:', err);

            setError(
                err.message ||
                'Failed to delete protected document.'
            );
        }
    };

    // ------------------------------------------------------------
    // FILTER
    // ------------------------------------------------------------

    const filteredDocuments = documents.filter((document) => {
        const query = search.toLowerCase();

        return (
            document.name?.toLowerCase().includes(query) ||
            document.description?.toLowerCase().includes(query) ||
            document.document_type?.toLowerCase().includes(query) ||
            document.sensitivity_level?.toLowerCase().includes(query)
        );
    });

    // ------------------------------------------------------------
    // STATS
    // ------------------------------------------------------------

    const eligibleCount = documents.filter(
        document => document.break_glass_enabled
    ).length;

    const restrictedCount = documents.length - eligibleCount;

    // ------------------------------------------------------------
    // ACCESS CONTROL
    // ------------------------------------------------------------

    if (!isAdmin) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-md rounded-2xl border border-red-900/50 bg-red-950/20 p-8 text-center">
                    <ShieldOff className="mx-auto h-12 w-12 text-red-500" />

                    <h2 className="mt-4 text-xl font-bold text-white">
                        403 Access Denied
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Protected document management is restricted to
                        authorized administrators and operators.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-7">

            {/* ====================================================== */}
            {/* HEADER */}
            {/* ====================================================== */}

            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#101A35] via-[#0D162D] to-[#0A1022] p-6 sm:p-7">

                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-purple-600/10 blur-3xl" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div>
                        <div className="flex items-center gap-2">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
                                <Database className="h-5 w-5 text-purple-400" />
                            </div>

                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-purple-400">
                                Protected Document Registry
                            </span>

                        </div>

                        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
                            Protected Documents
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-slate-400">
                            Manage organizational documents that may be made available
                            through the Break-Glass emergency authorization workflow.
                        </p>
                    </div>

                    <button
                        onClick={openAddModal}
                        className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-500"
                    >
                        <Plus className="h-4 w-4" />
                        ADD DOCUMENT
                    </button>

                </div>
            </div>

            {/* ====================================================== */}
            {/* ALERTS */}
            {/* ====================================================== */}

            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                    <div>
                        <p className="text-sm font-semibold text-red-300">
                            Operation failed
                        </p>

                        <p className="mt-1 text-xs text-red-200/70">
                            {error}
                        </p>
                    </div>

                    <button
                        onClick={() => setError('')}
                        className="ml-auto text-slate-500 hover:text-white"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                    <p className="text-sm text-emerald-300">
                        {success}
                    </p>
                </div>
            )}

            {/* ====================================================== */}
            {/* STATISTICS */}
            {/* ====================================================== */}

            <div className="grid gap-4 sm:grid-cols-3">

                <div className="rounded-xl border border-slate-800 bg-[#0B132B] p-5">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        Total Documents
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-white">
                        {documents.length}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Registered protected resources
                    </p>
                </div>

                <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-5">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-500">
                        Break-Glass Eligible
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-emerald-400">
                        {eligibleCount}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Available in emergency request form
                    </p>
                </div>

                <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-5">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-red-400">
                        Restricted
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-red-400">
                        {restrictedCount}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Not available for emergency requests
                    </p>
                </div>

            </div>

            {/* ====================================================== */}
            {/* TOOLBAR */}
            {/* ====================================================== */}

            <div className="flex flex-col gap-3 sm:flex-row">

                <div className="relative flex-1">

                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search protected documents..."
                        className="w-full rounded-xl border border-slate-800 bg-[#0B132B] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500"
                    />

                </div>

                <button
                    onClick={loadDocuments}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#0B132B] px-5 py-3 text-sm font-semibold text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                    />
                    Refresh
                </button>

            </div>

            {/* ====================================================== */}
            {/* DOCUMENT LIST */}
            {/* ====================================================== */}

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0B132B]">

                <div className="border-b border-slate-800 px-5 py-4">

                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-sm font-bold text-white">
                                Organizational Documents
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Only documents marked as Break-Glass Eligible appear
                                in user emergency-access requests.
                            </p>
                        </div>

                        <Lock className="h-5 w-5 text-slate-600" />

                    </div>

                </div>

                {loading ? (

                    <div className="flex min-h-[250px] items-center justify-center">

                        <div className="text-center">

                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />

                            <p className="mt-3 text-xs text-slate-500">
                                Loading protected document registry...
                            </p>

                        </div>

                    </div>

                ) : filteredDocuments.length === 0 ? (

                    <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">

                        <FileText className="h-10 w-10 text-slate-700" />

                        <h3 className="mt-4 text-sm font-bold text-slate-300">
                            No documents found
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Add a protected document or change your search.
                        </p>

                    </div>

                ) : (

                    <div className="divide-y divide-slate-800">

                        {filteredDocuments.map(document => (

                            <div
                                key={document.id}
                                className="p-5 transition hover:bg-slate-900/40"
                            >

                                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                    {/* DOCUMENT INFO */}

                                    <div className="flex min-w-0 items-start gap-4">

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
                                            <FileText className="h-5 w-5 text-slate-400" />
                                        </div>

                                        <div className="min-w-0">

                                            <div className="flex flex-wrap items-center gap-2">

                                                <h3 className="truncate text-sm font-bold text-white">
                                                    {document.name}
                                                </h3>

                                                {document.break_glass_enabled ? (

                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        Break-Glass
                                                    </span>

                                                ) : (

                                                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                        <ShieldOff className="h-3 w-3" />
                                                        Restricted
                                                    </span>

                                                )}

                                            </div>

                                            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
                                                {document.description || 'No description provided.'}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-2">

                                                <span className="rounded-md bg-slate-900 px-2 py-1 text-[9px] font-mono uppercase text-slate-500">
                                                    {document.document_type || 'DOCUMENT'}
                                                </span>

                                                <span className="rounded-md bg-slate-900 px-2 py-1 text-[9px] font-mono uppercase text-slate-500">
                                                    {document.sensitivity_level || 'HIGH'} SENSITIVITY
                                                </span>

                                                {document.storage_path && (
                                                    <span className="max-w-[300px] truncate rounded-md bg-slate-900 px-2 py-1 text-[9px] font-mono text-slate-600">
                                                        {document.storage_path}
                                                    </span>
                                                )}

                                            </div>

                                        </div>

                                    </div>

                                    {/* ACTIONS */}

                                    <div className="flex shrink-0 flex-wrap gap-2">

                                        <button
                                            onClick={() => toggleBreakGlass(document)}
                                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition ${document.break_glass_enabled
                                                    ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                                                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                                }`}
                                        >

                                            {document.break_glass_enabled ? (
                                                <>
                                                    <ShieldOff className="h-3.5 w-3.5" />
                                                    Disable
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="h-3.5 w-3.5" />
                                                    Enable
                                                </>
                                            )}

                                        </button>

                                        <button
                                            onClick={() => openEditModal(document)}
                                            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-600 hover:text-white"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleDelete(document)}
                                            className="flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/30"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Remove
                                        </button>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

            {/* ====================================================== */}
            {/* ADD / EDIT MODAL */}
            {/* ====================================================== */}

            {showAddModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-[#0B132B] shadow-2xl">

                        <div className="border-b border-slate-800 px-6 py-5">

                            <div className="flex items-center justify-between">

                                <div>

                                    <h2 className="text-lg font-bold text-white">
                                        {editingDocument
                                            ? 'Edit Protected Document'
                                            : 'Add Protected Document'}
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Configure the document's Break-Glass authorization policy.
                                    </p>

                                </div>

                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="text-slate-500 hover:text-white"
                                >
                                    <XCircle className="h-5 w-5" />
                                </button>

                            </div>

                        </div>

                        <form onSubmit={handleSave} className="space-y-5 p-6">

                            <div>

                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Document Name
                                </label>

                                <input
                                    value={form.name}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Disaster Recovery Runbook"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500"
                                    required
                                />

                            </div>

                            <div>

                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Description
                                </label>

                                <textarea
                                    value={form.description}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            description: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    placeholder="What does this document contain?"
                                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500"
                                    required
                                />

                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">

                                <div>

                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Sensitivity
                                    </label>

                                    <select
                                        value={form.sensitivity_level}
                                        onChange={e =>
                                            setForm({
                                                ...form,
                                                sensitivity_level: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>

                                </div>

                                <div>

                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Document Type
                                    </label>

                                    <select
                                        value={form.document_type}
                                        onChange={e =>
                                            setForm({
                                                ...form,
                                                document_type: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                                    >
                                        <option>PDF</option>
                                        <option>DOCX</option>
                                        <option>XLSX</option>
                                        <option>TXT</option>
                                        <option>IMAGE</option>
                                        <option>OTHER</option>
                                    </select>

                                </div>

                            </div>

                            <div>

                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Storage Path
                                </label>

                                <input
                                    value={form.storage_path}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            storage_path: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. protected/disaster-recovery/runbook.pdf"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-mono text-white outline-none placeholder:text-slate-600 focus:border-purple-500"
                                />

                            </div>

                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">

                                <input
                                    type="checkbox"
                                    checked={form.break_glass_enabled}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            break_glass_enabled: e.target.checked,
                                        })
                                    }
                                    className="mt-1 h-4 w-4 accent-emerald-500"
                                />

                                <div>

                                    <p className="text-sm font-bold text-white">
                                        Allow Break-Glass Access
                                    </p>

                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                        When enabled, authorized users can request temporary
                                        access to this document during an emergency. The request
                                        still requires administrator approval.
                                    </p>

                                </div>

                            </label>

                            <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                                >

                                    {saving && (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    )}

                                    {editingDocument ? 'Save Changes' : 'Add Document'}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ProtectedDocuments;