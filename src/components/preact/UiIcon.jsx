import { uiIcons } from '../../lib/ui-icons.js';

/** Decorative SVG. The enclosing labeled control owns its accessible name. */
export default function UiIcon({ id, state = 'auto', tone, class: className = '', ...props }) {
 const icon = uiIcons[id];
 if (!icon) throw new Error(`Unknown UI icon: ${id}`);
 return <svg {...props} class={`ui-icon icon ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-icon={id} data-state={state} data-tone={tone}>
  <g class="ui-icon__line" dangerouslySetInnerHTML={{ __html: icon.line }} />
  <g class="ui-icon__filled" dangerouslySetInnerHTML={{ __html: icon.filled }} />
 </svg>;
}
