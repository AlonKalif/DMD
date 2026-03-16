import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
} from 'features/crawl/crawlSlice';
import { CharacterTemplate } from 'types/api';
import { BankToolbar } from './BankToolbar';
import { BankGrid } from './BankGrid';
import { TemplateFormModal } from './TemplateFormModal';

interface CharacterBankProps {
    onRequestInitiative: (template: CharacterTemplate) => void;
}

export function CharacterBank({ onRequestInitiative }: CharacterBankProps) {
    const dispatch = useAppDispatch();
    const status = useAppSelector((state) => state.crawl.status);

    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<CharacterTemplate | undefined>();

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchTemplates());
        }
    }, [status, dispatch]);

    const handleNewTemplate = () => {
        setEditingTemplate(undefined);
        setShowForm(true);
    };

    const handleEdit = (template: CharacterTemplate) => {
        setEditingTemplate(template);
        setShowForm(true);
    };

    const handleDelete = useCallback(async (id: number) => {
        if (window.confirm('Delete this character template?')) {
            dispatch(deleteTemplate(id));
        }
    }, [dispatch]);

    const handleSave = useCallback(async (data: Omit<CharacterTemplate, 'ID'>) => {
        if (editingTemplate) {
            await dispatch(
                updateTemplate({ ...data, ID: editingTemplate.ID })
            ).unwrap();
        } else {
            await dispatch(createTemplate(data)).unwrap();
        }
        setShowForm(false);
        setEditingTemplate(undefined);
    }, [dispatch, editingTemplate]);

    const handleDoubleClick = (template: CharacterTemplate) => {
        onRequestInitiative(template);
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <BankToolbar onNewTemplate={handleNewTemplate} />
            <BankGrid
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDoubleClick={handleDoubleClick}
            />

            {showForm && (
                <TemplateFormModal
                    initial={editingTemplate}
                    onSave={handleSave}
                    onClose={() => { setShowForm(false); setEditingTemplate(undefined); }}
                />
            )}
        </div>
    );
}
