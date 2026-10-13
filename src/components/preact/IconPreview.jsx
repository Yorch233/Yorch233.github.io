import { useState } from 'preact/hooks';
import UiIcon from './UiIcon.jsx';
import { uiIconCatalog } from '../../lib/ui-icon-catalog.js';

const sections = [['user', 'About Me'], ['news', 'News'], ['file', 'Publications'], ['trophy', 'Awards'], ['mail', 'Contact']];
export default function IconPreview() {
 const [selected, setSelected] = useState('user');
 const [state, setState] = useState('active');
 return <div class="icon-preview">
  <div class="icon-preview-nav" role="group" aria-label="Preview section">
   {sections.map(([id, label]) => <button key={id} type="button" aria-pressed={selected === id} onClick={() => setSelected(id)}><UiIcon id={id} />{label}</button>)}
  </div>
  <p class="icon-preview-note">Select a section. The active icon fills with two colors; the others stay outlined.</p>
  <label class="icon-preview-picker">Preview any icon
   <select aria-label="Choose an icon" value={selected} onChange={event => setSelected(event.currentTarget.value)}>
    {uiIconCatalog.map(icon => <option key={icon.id} value={icon.id}>{icon.label} · {icon.id}</option>)}
   </select>
  </label>
  <div class="icon-preview-options" role="group" aria-label="Size sample state">
   <button type="button" aria-pressed={state === 'active'} onClick={() => setState('active')}>Active</button>
   <button type="button" aria-pressed={state === 'inactive'} onClick={() => setState('inactive')}>Inactive</button>
  </div>
  <div class="icon-size-samples" aria-label="Icon sizes" data-preview-state={state}>
   {[16, 20, 24].map(size => <span key={size}><UiIcon id={selected} state={state} style={{ width: size, height: size }} /><small>{size}px</small></span>)}
  </div>
 </div>;
}
