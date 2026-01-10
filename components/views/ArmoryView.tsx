
import React, { useState } from 'react';
import { ScreenWrapper } from '../layout/ScreenWrapper';
import { GlobalHeader } from '../layout/GlobalHeader';
import { Phase, ItemSlot, Item, DamageType } from '../../types';
import { Button } from '../ui/Button';
import { Crosshair, Shield, Zap, Info, Skull, Trash2, Box, Activity, Users, ChevronLeft } from 'lucide-react';
import { ARMORY_ITEMS } from '../../constants';
import { OperativesListView } from './OperativesListView'; // Import the component

interface ArmoryViewProps {
  game: any;
  onBack: () => void;
}

export const ArmoryView: React.FC<ArmoryViewProps> = ({ game, onBack }) => {
  const { unlockedItems, currentLoadout, equipItem, unequipItem, materials, credits } = game;
  const [selectedSlot, setSelectedSlot] = useState<ItemSlot>(ItemSlot.PRIMARY);
  const [viewMode, setViewMode] = useState<'LOADOUT' | 'OPERATIVES'>('LOADOUT');

  const availableItems = ARMORY_ITEMS.filter(i => i.slot === selectedSlot && unlockedItems.includes(i.id));
  const lockedItems = ARMORY_ITEMS.filter(i => i.slot === selectedSlot && !unlockedItems.includes(i.id));

  const getDamageColor = (type?: DamageType) => {
      if (type === DamageType.KINETIC) return "text-amber-400";
      if (type === DamageType.ENERGY) return "text-teal-400";
      if (type === DamageType.EXPLOSIVE) return "text-red-500";
      return "text-slate-400";
  };

  const renderItemCard = (item: Item, isEquipped: boolean, isLocked: boolean) => (
    <div key={item.id} className={`p-4 rounded-2xl border transition-all relative ${isEquipped ? 'bg-teal-500/10 border-teal-500' : isLocked ? 'bg-black/40 border-slate-900 opacity-60' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
        <div className="flex justify-between items-start mb-2">
            <div>
                <h3 className={`text-xs font-black uppercase ${isLocked ? 'text-slate-600' : 'text-white'}`}>{item.name}</h3>
                <p className="text-[9px] text-slate-500 font-mono mt-1">{item.description}</p>
            </div>
            {item.damageType && (
                <div className={`p-1.5 rounded bg-black border border-slate-800 ${getDamageColor(item.damageType)}`}>
                    <Skull size={14} />
                </div>
            )}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 my-3">
            {item.range && <div className="text-[8px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded">RNG: {item.range}</div>}
            {item.weight !== undefined && <div className="text-[8px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded">WGT: {item.weight > 0 ? '+' : ''}{item.weight}</div>}
            {item.maxUses && <div className="text-[8px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded">USES: {item.maxUses}</div>}
            {item.damageType && <div className={`text-[8px] font-mono bg-black/40 px-2 py-1 rounded ${getDamageColor(item.damageType)}`}>{item.damageType}</div>}
        </div>

        {!isLocked ? (
            <Button 
                variant={isEquipped ? "danger" : "secondary"} 
                size="sm" 
                className="w-full py-2 text-[9px]"
                onClick={() => isEquipped ? unequipItem(item.slot) : equipItem(item)}
            >
                {isEquipped ? "UNEQUIP" : "EQUIP"}
            </Button>
        ) : (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                <span className="text-[9px] font-mono text-slate-500">LOCKED</span>
                <span className="text-[9px] font-bold text-amber-500">{item.cost} CR</span>
            </div>
        )}
    </div>
  );

  if (viewMode === 'OPERATIVES') {
      return (
          <div className="h-full flex flex-col">
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={() => setViewMode('LOADOUT')} className="flex items-center gap-2">
                      <ChevronLeft size={16} /> Back to Loadout
                  </Button>
                  <div className="text-xs font-black uppercase text-teal-500">OPERATIVE ROSTER</div>
              </div>
              <div className="flex-1 overflow-hidden">
                  <OperativesListView game={game} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} />
              </div>
          </div>
      );
  }

  return (
    <ScreenWrapper visualLevel={game.visualLevel} centerContent={false}>
      <GlobalHeader phase={Phase.MENU} onHelp={() => game.setIsHelpOpen(true)} onSettings={() => game.setIsSettingsOpen(true)} onExit={() => {}} credits={game.credits} xp={game.xp} />
      
      <div className="flex-1 flex flex-col p-4 sm:p-6 pb-32 max-w-5xl mx-auto w-full">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-6">
            <div>
               <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">TACTICAL ARMORY</h2>
               <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Loadout Configuration</p>
            </div>
            
            <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
                <button onClick={() => setViewMode('LOADOUT')} className="px-4 py-2 rounded-lg text-[9px] font-black uppercase bg-teal-500 text-black shadow-lg">
                    <Box size={14} className="inline mr-2"/> Gear
                </button>
                <button onClick={() => setViewMode('OPERATIVES')} className="px-4 py-2 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors">
                    <Users size={14} className="inline mr-2"/> Operatives
                </button>
            </div>
         </div>
         
         {/* Slot Selector */}
         <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 w-full sm:w-fit mb-6">
            <button onClick={() => setSelectedSlot(ItemSlot.PRIMARY)} className={`flex-1 sm:flex-none px-6 py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${selectedSlot === ItemSlot.PRIMARY ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
               <Crosshair size={14}/> Primary
            </button>
            <button onClick={() => setSelectedSlot(ItemSlot.SECONDARY)} className={`flex-1 sm:flex-none px-6 py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${selectedSlot === ItemSlot.SECONDARY ? 'bg-teal-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>
               <Activity size={14}/> Utility
            </button>
            <button onClick={() => setSelectedSlot(ItemSlot.SHIELD)} className={`flex-1 sm:flex-none px-6 py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${selectedSlot === ItemSlot.SHIELD ? 'bg-sky-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>
               <Shield size={14}/> Shield
            </button>
         </div>

         {/* Current Slot Info Header */}
         <div className="mb-6 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
             <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                 {selectedSlot === ItemSlot.PRIMARY && <Crosshair className="text-red-500" size={24} />}
                 {selectedSlot === ItemSlot.SECONDARY && <Activity className="text-teal-500" size={24} />}
                 {selectedSlot === ItemSlot.SHIELD && <Shield className="text-sky-500" size={24} />}
             </div>
             <div>
                 <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Current Equipped</div>
                 <div className="text-lg font-black text-white italic">
                     {selectedSlot === ItemSlot.PRIMARY && (currentLoadout.primary?.name || "Standard Issue (Default)")}
                     {selectedSlot === ItemSlot.SECONDARY && (currentLoadout.secondary?.name || "None")}
                     {selectedSlot === ItemSlot.SHIELD && (currentLoadout.shield?.name || "Standard Plating")}
                 </div>
             </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableItems.map(item => {
                    const isEquipped = 
                        (item.slot === 'PRIMARY' && currentLoadout.primary?.id === item.id) ||
                        (item.slot === 'SECONDARY' && currentLoadout.secondary?.id === item.id) ||
                        (item.slot === 'SHIELD' && currentLoadout.shield?.id === item.id);
                    return renderItemCard(item, isEquipped, false);
                })}
                {lockedItems.map(item => renderItemCard(item, false, true))}
            </div>
            
            {availableItems.length === 0 && lockedItems.length === 0 && (
                <div className="text-center py-10 text-slate-600 font-mono text-xs uppercase">No items found for this slot. Check Market.</div>
            )}
         </div>
      </div>
    </ScreenWrapper>
  );
};
