export interface AgendaSession {
  time: string;
  category: string;
  title: string;
  meta?: string;
  personName?: string;
  photoFile?: string;
  companyLogoFile?: string;
  bioParagraphs?: string[];
  participants?: Participant[];
  pending?: boolean;
}

export interface Participant {
  honorific?: string;
  name: string;
  role?: string;
  photoFile?: string;
  companyLogoFile?: string;
}

export interface Sponsor {
  name: string;
  logoFile: string;
}

export interface Hotel {
  name: string;
  rateFrom: string;
  phone: string;
  phoneHref: string;
}

export interface OtherEvent {
  name: string;
  dateLabel: string;
  description: string;
  url?: string;
  imageFile?: string;
  popupUntil?: string;
}

export interface VideoItem {
  title: string;
  file: string;
  posterFile?: string;
  captionsFile?: string;
}

export function initials(name: string | undefined): string {
  if (!name) return '';
  const parts = name.split(' ').filter(p => p.length > 0 && /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(p[0]));
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

export function displayName(p: Participant): string {
  return p.honorific ? `${p.honorific} ${p.name}` : p.name;
}

export function badgeClass(category: string): string {
  const map: Record<string, string> = {
    Ponencia: 'badge-ponencia',
    Panel: 'badge-panel',
    Receso: 'badge-receso',
    Logistica: 'badge-logistica',
    Visita: 'badge-visita',
    Institucional: 'badge-institucional',
    Bienvenida: 'badge-bienvenida',
  };
  return map[category] ?? 'badge-receso';
}

export function categoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Institucional: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V4.5L14 3v18"></path><path d="M14 8l6 1.5V21"></path><path d="M4 21h16"></path><path d="M8 8h2M8 12h2M8 16h2"></path></svg>',
    Receso: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z"></path><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16"></path><path d="M8 3c0 1-1 1-1 2s1 1 1 2M12 3c0 1-1 1-1 2s1 1 1 2"></path></svg>',
    Logistica: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2"></circle><circle cx="18" cy="5" r="2"></circle><path d="M6 17V13a4 4 0 0 1 4-4h4a4 4 0 0 0 4-4"></path></svg>',
    Visita: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3h4M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3"></path><path d="M8 15h8"></path></svg>',
    Bienvenida: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"></path></svg>',
  };
  return icons[category] ?? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"></circle><path d="M2.5 20a6.5 6.5 0 0 1 13 0"></path><circle cx="17.5" cy="9" r="2.5"></circle><path d="M15.5 13.2A5.5 5.5 0 0 1 21.5 18"></path></svg>';
}
