/**
 * Conversão de ícones legados (Font Awesome) para PrimeIcons (Sakai).
 * O banco legado grava fa-*; o padrão novo é pi pi-*.
 *
 * Uso:
 *   faToPi('fa-cog')       -> 'pi pi-cog'
 *   faToPi('pi pi-cog')    -> 'pi pi-cog' (já está no padrão)
 *   faToPi(null)           -> null
 *   faToPi('fa-inexistente')-> 'pi pi-question-circle' (fallback)
 */

const FALLBACK = 'pi pi-question-circle';

const MAP = {
  'fa-cog': 'pi pi-cog',
  'fa-file': 'pi pi-file',
  'fa-pencil': 'pi pi-pencil',
  'fa-lock': 'pi pi-lock',
  'fa-users': 'pi pi-users',
  'fa-user': 'pi pi-user',
  'fa-address-card': 'pi pi-id-card',
  'fa-id-card-o': 'pi pi-id-card',
  'fa-map-o': 'pi pi-map',
  'fa-map-marker': 'pi pi-map-marker',
  'fa-thermometer': 'pi pi-chart-line',
  'fa-barcode': 'pi pi-barcode',
  'fa-qrcode': 'pi pi-qrcode',
  'fa-camera': 'pi pi-camera',
  'fa-calendar': 'pi pi-calendar',
  'fa-calendar-o': 'pi pi-calendar',
  'fa-print': 'pi pi-print',
  'fa-comments': 'pi pi-comments',
  'fa-upload': 'pi pi-upload',
  'fa-university': 'pi pi-building-columns',
  'fa-graduation-cap': 'pi pi-graduation-cap',
  'fa-user-circle': 'pi pi-user',
  'fa-gavel': 'pi pi-briefcase',
  'fa-building': 'pi pi-building',
  'fa-cogs': 'pi pi-cog',
  'fa-heartbeat': 'pi pi-heart',
  'fa-handshake-o': 'pi pi-users',
  'fa-pencil-square-o': 'pi pi-pencil',
  'fa-arrow-circle-up': 'pi pi-arrow-circle-up',
  'fa-arrow-circle-down': 'pi pi-arrow-circle-down',
  'fa-cubes': 'pi pi-box',
  'fa-archive': 'pi pi-box',
  'fa-truck': 'pi pi-truck',
  'fa-cutlery': 'pi pi-heart',
  'fa-money': 'pi pi-money-bill',
  'fa-dollar': 'pi pi-dollar',
  'fa-credit-card': 'pi pi-credit-card',
  'fa-tags': 'pi pi-tags',
};

/**
 * @param {string|null|undefined} icone
 * @returns {string|null}
 */
export function faToPi(icone) {
  if (!icone) return null;
  if (icone.startsWith('pi ')) return icone; // já é PrimeIcons
  return MAP[icone] ?? FALLBACK;
}

/**
 * Opções para o Select do formulário.
 * label = nome legível; value = classe PrimeIcons.
 * Ordenado alfabeticamente pelo label.
 */
export const ICONES_OPTIONS = Object.entries(MAP)
  .map(([fa, pi]) => ({
    label: fa.replace('fa-', ''), // rótulo derivado do nome legado
    value: pi,
  }))
  .filter((opt, idx, arr) => arr.findIndex((o) => o.value === opt.value) === idx) // remove duplicados
  .sort((a, b) => a.label.localeCompare(b.label));
  