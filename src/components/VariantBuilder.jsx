import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  buildRows, groupsFromRows, parseJson, calcDiscountPercent, calcDiscountedPrice,
} from '../utils/variants';

// Variants are one row per option combination, e.g. { Volume: "6ml", Color: "Gold" }.
// The admin picks option groups + values; rows are generated as their combinations.

const MAX_GROUPS = 3;
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white';
const cellInputCls = 'w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700';

function OptionGroup({ group, attributes, colors, usedNames, onChange, onRemove }) {
  const [draft, setDraft] = useState('');
  const attribute = attributes.find(item => item.name === group.name);
  const suggestions = group.name === 'Color'
    ? colors.map(color => color.name)
    : parseJson(attribute?.values, []).map(String);
  // Keep the saved name selectable even if that attribute was renamed or not loaded yet.
  const nameChoices = [group.name, 'Color', ...attributes.map(item => item.name)]
    .filter(Boolean)
    .filter((name, idx, all) => all.indexOf(name) === idx)
    .filter(name => name === group.name || !usedNames.includes(name));

  function addValue(raw) {
    const value = String(raw || '').trim();
    if (!value || group.values.includes(value)) return;
    onChange({ ...group, values: [...group.values, value] });
    setDraft('');
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <select
          className={`${inputCls} max-w-[220px]`}
          value={group.name}
          onChange={e => onChange({ name: e.target.value, values: [] })}
        >
          <option value="">Select option (Size / Color / ML)</option>
          {nameChoices.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <button type="button" onClick={onRemove} className="ml-auto h-9 w-9 rounded-lg bg-rose-500 text-white inline-flex items-center justify-center">
          <Trash2 size={14} />
        </button>
      </div>
      {group.name && (
        <div className="flex min-h-10 flex-wrap items-center gap-2 border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
          {group.values.map(value => (
            <span key={value} className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
              {value}
              <button type="button" onClick={() => onChange({ ...group, values: group.values.filter(item => item !== value) })}>
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            list={`variant-values-${group.name}`}
            className="min-w-[160px] flex-1 bg-transparent px-2 py-1 text-sm text-gray-700 focus:outline-none"
            placeholder="Type a value and press Enter (e.g. 6ml)"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addValue(draft); } }}
          />
          <datalist id={`variant-values-${group.name}`}>
            {suggestions.filter(value => !group.values.includes(value)).map(value => <option key={value} value={value} />)}
          </datalist>
          <button type="button" onClick={() => addValue(draft)} className="rounded bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// With the ERP connected, variant stock is synced from ERP stock and cannot be typed here.
const ERP_STOCK = import.meta.env.VITE_ERP_STOCK_SYNC === 'true';

export default function VariantBuilder({ attributes = [], colors = [], images = [], rows, onChange, stockFromErp = ERP_STOCK }) {
  const [groups, setGroups] = useState(() => groupsFromRows(rows));
  const [bulk, setBulk] = useState({ purchasePrice: '', oldPrice: '', newPrice: '', stock: '' });

  function updateGroups(nextGroups) {
    setGroups(nextGroups);
    onChange(buildRows(nextGroups, rows));
  }

  function updateRow(key, field, value) {
    onChange(rows.map((row) => {
      if (row.key !== key) return row;
      const next = { ...row, [field]: value };
      if (field === 'discountPercent') {
        const discount = value === '' ? '' : Math.max(0, Math.min(100, Number(value) || 0));
        next.discountPercent = discount;
        next.newPrice = discount === '' ? next.newPrice : calcDiscountedPrice(next.oldPrice, discount);
      }
      if (field === 'oldPrice' && next.discountPercent !== '') next.newPrice = calcDiscountedPrice(value, next.discountPercent);
      if (field === 'newPrice') next.discountPercent = calcDiscountPercent(next.oldPrice, value);
      return next;
    }));
  }

  function applyBulk() {
    const filled = Object.fromEntries(Object.entries(bulk).filter(([, value]) => value !== ''));
    onChange(rows.map((row) => {
      const next = { ...row, ...filled };
      next.discountPercent = calcDiscountPercent(next.oldPrice, next.newPrice);
      return next;
    }));
  }

  const hasOptions = rows.some(row => row.options);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600">Options</p>
        {groups.map((group, idx) => (
          <OptionGroup
            key={idx}
            group={group}
            attributes={attributes}
            colors={colors}
            usedNames={groups.map(item => item.name)}
            onChange={next => updateGroups(groups.map((item, i) => (i === idx ? next : item)))}
            onRemove={() => updateGroups(groups.filter((_, i) => i !== idx))}
          />
        ))}
        {groups.length < MAX_GROUPS && (
          <button type="button" onClick={() => setGroups([...groups, { name: '', values: [] }])} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition">
            <Plus size={13} /> Add option (Size, Color, ML…)
          </button>
        )}
        {!groups.length && (
          <p className="text-xs text-gray-400">No options: the product is sold at a single price.</p>
        )}
      </div>

      {rows.length > 1 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] rounded-lg border border-gray-200 bg-gray-50 p-3">
          <input type="number" className={inputCls} placeholder="Purchase Price (all)" value={bulk.purchasePrice} onChange={e => setBulk(prev => ({ ...prev, purchasePrice: e.target.value }))} />
          <input type="number" className={inputCls} placeholder="Old Price (all)" value={bulk.oldPrice} onChange={e => setBulk(prev => ({ ...prev, oldPrice: e.target.value }))} />
          <input type="number" className={inputCls} placeholder="New Price (all)" value={bulk.newPrice} onChange={e => setBulk(prev => ({ ...prev, newPrice: e.target.value }))} />
          <input type="number" className={inputCls} placeholder={stockFromErp ? 'Stock (ERP থেকে)' : 'Stock (all)'} disabled={stockFromErp} value={bulk.stock} onChange={e => setBulk(prev => ({ ...prev, stock: e.target.value }))} />
          <button type="button" onClick={applyBulk} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
            Apply to all
          </button>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[980px] text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {hasOptions && <th className="px-4 py-3 text-left text-gray-600 font-semibold">Variant</th>}
              {images.length > 0 && <th className="px-4 py-3 text-left text-gray-600 font-semibold">Image</th>}
              <th className="px-4 py-3 text-left text-gray-600 font-semibold">SKU</th>
              <th className="px-4 py-3 text-left text-gray-600 font-semibold">Purchase Price</th>
              <th className="px-4 py-3 text-left text-gray-600 font-semibold">Old Price</th>
              <th className="px-4 py-3 text-left text-gray-600 font-semibold">Discount %</th>
              <th className="px-4 py-3 text-left text-gray-600 font-semibold">New Price *</th>
              <th className="px-4 py-3 text-left text-gray-600 font-semibold" title={stockFromErp ? 'ERP stock থেকে আসে' : undefined}>{stockFromErp ? 'Stock (ERP)' : 'Stock'}</th>
              <th className="px-4 py-3 text-center text-gray-600 font-semibold">Available</th>
              <th className="px-4 py-3 text-center text-gray-600 font-semibold" title="Stock না থাকলেও order নেওয়া যাবে">Pre Order</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key || 'default'} className="border-b border-gray-100 last:border-0">
                {hasOptions && (
                  <td className="px-4 py-2 font-semibold text-gray-700 whitespace-nowrap">
                    {Object.values(row.options || {}).join(' / ') || '-'}
                  </td>
                )}
                {images.length > 0 && (
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {images.find(image => image.ref === row.image) ? (
                        <img src={images.find(image => image.ref === row.image).src} alt="" className="h-9 w-9 shrink-0 rounded border border-gray-200 object-cover" />
                      ) : (
                        <span className="h-9 w-9 shrink-0 rounded border border-dashed border-gray-300" />
                      )}
                      <select value={images.some(image => image.ref === row.image) ? row.image : ''} onChange={e => updateRow(row.key, 'image', e.target.value)} className={cellInputCls}>
                        <option value="">Default</option>
                        {images.map((image, idx) => <option key={image.ref} value={image.ref}>Image {idx + 1}</option>)}
                      </select>
                    </div>
                  </td>
                )}
                <td className="px-3 py-2"><input type="text" value={row.sku} onChange={e => updateRow(row.key, 'sku', e.target.value)} className={cellInputCls} /></td>
                <td className="px-3 py-2"><input type="number" value={row.purchasePrice} onChange={e => updateRow(row.key, 'purchasePrice', e.target.value)} className={cellInputCls} /></td>
                <td className="px-3 py-2"><input type="number" value={row.oldPrice} onChange={e => updateRow(row.key, 'oldPrice', e.target.value)} className={cellInputCls} /></td>
                <td className="px-3 py-2"><input type="number" min="0" max="100" step="0.01" value={row.discountPercent} onChange={e => updateRow(row.key, 'discountPercent', e.target.value)} className={cellInputCls} placeholder="%" /></td>
                <td className="px-3 py-2"><input type="number" value={row.newPrice} onChange={e => updateRow(row.key, 'newPrice', e.target.value)} className={cellInputCls} /></td>
                <td className="px-3 py-2"><input type="number" value={row.stock} readOnly={stockFromErp} onChange={e => updateRow(row.key, 'stock', e.target.value)} className={`${cellInputCls} ${stockFromErp ? 'bg-gray-100 text-gray-500' : ''}`} /></td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={row.availability !== 'out of stock'}
                    onChange={e => updateRow(row.key, 'availability', e.target.checked ? 'in stock' : 'out of stock')}
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-orange-500"
                    checked={Boolean(row.preOrder)}
                    onChange={e => updateRow(row.key, 'preOrder', e.target.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasOptions && (
        <p className="text-xs text-gray-400">যে combination বিক্রি হবে না, তার New Price খালি রাখুন। ওটা সেভ হবে না।</p>
      )}
    </div>
  );
}
