import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { addCombatant } from 'features/crawl/crawlSlice';
import { CharacterTemplate, BattleDisplayPayload } from 'types/api';
import { BattleSection } from 'components/crawl/BattleSection';
import { CharacterBank } from 'components/crawl/CharacterBank';
import { InitiativeModal } from 'components/crawl/InitiativeModal';
import { CharacterViewModal } from 'components/crawl/CharacterViewModal';
import { BroadcastMessage } from 'hooks/useBroadcastChannel';

export default function DungeonCrawlPage() {
    const dispatch = useAppDispatch();
    const [initiativeTarget, setInitiativeTarget] = useState<CharacterTemplate | null>(null);
    const [viewingTemplate, setViewingTemplate] = useState<CharacterTemplate | null>(null);
    const [isBattleShown, setIsBattleShown] = useState(false);

    const combatants = useAppSelector((state) => state.crawl.combatants);
    const templates = useAppSelector((state) => state.crawl.templates);
    const activeTurnIndex = useAppSelector((state) => state.crawl.activeTurnIndex);
    const round = useAppSelector((state) => state.crawl.round);

    const channel = useMemo(() => new BroadcastChannel('dmd-channel'), []);

    useEffect(() => {
        const handler = (event: MessageEvent<BroadcastMessage>) => {
            const msg = event.data;
            if (msg.type === 'player_content_changed') {
                const contentType = msg.payload?.contentType;
                if (contentType !== 'battle') {
                    setIsBattleShown(false);
                }
            }
            if (msg.type === 'response_is_battle') {
                setIsBattleShown(true);
            }
        };
        channel.onmessage = handler;
        return () => { channel.onmessage = null; };
    }, [channel]);

    useEffect(() => {
        channel.postMessage({ type: 'request_current_content' });
    }, [channel]);

    const buildBattlePayload = useCallback((): BattleDisplayPayload => {
        const usedTemplateIds = new Set(combatants.map(c => c.templateId));
        const usedTemplates = templates.filter(t => usedTemplateIds.has(t.ID));
        return { combatants, templates: usedTemplates, activeTurnIndex, round };
    }, [combatants, templates, activeTurnIndex, round]);

    useEffect(() => {
        if (!isBattleShown) return;
        if (combatants.length === 0) {
            channel.postMessage({ type: 'clear_battle' });
            setIsBattleShown(false);
            return;
        }
        channel.postMessage({ type: 'show_battle', payload: buildBattlePayload() });
    }, [isBattleShown, combatants, activeTurnIndex, round, channel, buildBattlePayload]);

    const handleToggleBattleDisplay = () => {
        if (isBattleShown) {
            channel.postMessage({ type: 'clear_battle' });
            setIsBattleShown(false);
        } else {
            if (combatants.length > 0) {
                channel.postMessage({ type: 'show_battle', payload: buildBattlePayload() });
                setIsBattleShown(true);
            }
        }
    };

    const handleRequestInitiative = (template: CharacterTemplate) => {
        setInitiativeTarget(template);
    };

    const handleInitiativeConfirm = (template: CharacterTemplate, initiative: number) => {
        dispatch(addCombatant({ template, initiative }));
        setInitiativeTarget(null);
    };

    const handleViewTemplate = (template: CharacterTemplate) => {
        setViewingTemplate(template);
    };

    return (
        <div className="flex min-h-full flex-col gap-2 p-2 pb-2">
            <BattleSection
                onRequestInitiative={handleRequestInitiative}
                onViewTemplate={handleViewTemplate}
                isBattleShown={isBattleShown}
                onToggleBattleDisplay={handleToggleBattleDisplay}
            />

            {/* Flourish Divider */}
            <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-paladin-gold/40 to-transparent" />
                <span className="text-paladin-gold/60 text-sm select-none">&#10087; &#10086; &#10087;</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-paladin-gold/40 to-transparent" />
            </div>

            <CharacterBank onRequestInitiative={handleRequestInitiative} onViewTemplate={handleViewTemplate} />

            {initiativeTarget && (
                <InitiativeModal
                    template={initiativeTarget}
                    onConfirm={handleInitiativeConfirm}
                    onClose={() => setInitiativeTarget(null)}
                />
            )}

            {viewingTemplate && (
                <CharacterViewModal
                    template={viewingTemplate}
                    onClose={() => setViewingTemplate(null)}
                />
            )}
        </div>
    );
}
