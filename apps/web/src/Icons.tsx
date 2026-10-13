import type { ReactNode } from 'react';

type IconName = 'overview'|'project'|'prompt'|'pulse'|'evidence'|'content'|'publish'|'compare'|'usage'|'settings'|'arrow'|'search'|'bell'|'chevron'|'spark'|'check'|'clock'|'external'|'close'|'menu';

const iconPaths:Record<IconName,ReactNode> = {
  overview:<><path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z"/></>,
  project:<><path d="M4 6.5h6l2 2h8v9.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5Z"/><path d="M4 9h16"/></>,
  prompt:<><path d="M5 5h14v11H9l-4 3V5Z"/><path d="M8 9h8M8 12h5"/></>,
  pulse:<><path d="M3 12h4l2-6 4 12 2-6h6"/></>,
  evidence:<><path d="M6 3h9l3 3v15H6V3Z"/><path d="M14 3v4h4M9 11h6M9 15h6"/></>,
  content:<><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  publish:<><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 14v6h14v-6"/></>,
  compare:<><path d="M7 4v16M17 4v16M3 8l4-4 4 4M13 16l4 4 4-4"/></>,
  usage:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6a8 8 0 0 0-1.5.9l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2.2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.5.9l.3 2.6h4l.3-2.6a8 8 0 0 0 1.5-.9l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z"/></>,
  arrow:<><path d="M5 12h14M14 7l5 5-5 5"/></>,
  search:<><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></>,
  bell:<><path d="M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4L6 17Z"/><path d="M10 20h4"/></>,
  chevron:<><path d="m8 10 4 4 4-4"/></>,
  spark:<><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z"/><path d="m18 15 .7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7L18 15Z"/></>,
  check:<><path d="m5 12 4 4L19 6"/></>,
  clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  external:<><path d="M14 5h5v5M19 5l-8 8"/><path d="M18 13v6H5V6h6"/></>,
  menu:<><path d="M4 6h16M4 12h16M4 18h16"/></>,
  close:<><path d="m6 6 12 12M18 6 6 18"/></>,
};

export function Icon({name,size=18}:{name:IconName;size?:number}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

