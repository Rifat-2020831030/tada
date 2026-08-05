import { NoteColor } from '../types';

export const dark = {
  // Backgrounds
  bg: '#202124',
  bgCard: '#202124',
  bgElevated: '#2D2E30',
  bgInput: '#2D2E30',

  // Text
  text: '#E8EAED',
  textSecondary: '#9AA0A6',
  textDisabled: '#5F6368',

  // Interactive
  accent: '#8AB4F8',
  accentBg: '#1A3A5C',

  // Dividers & borders
  divider: '#3C4043',
  border: '#3C4043',

  // Checkbox
  checkboxUnchecked: '#9AA0A6',
  checkboxChecked: '#8AB4F8',

  // Google Keep note colors (Dark variants)
  noteColors: {
    default: '#202124',
    red: '#5C2B29',
    pink: '#4A1942',
    orange: '#622A0F',
    yellow: '#614A19',
    teal: '#0C625D',
    blue: '#1E3A5F',
    dark_blue: '#1A237E',
    purple: '#42275E',
    gray: '#37393B',
  } as Record<NoteColor, string>,
};

export const light = {
  // Backgrounds
  bg: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgElevated: '#F1F3F4',
  bgInput: '#F1F3F4',

  // Text
  text: '#202124',
  textSecondary: '#5F6368',
  textDisabled: '#9AA0A6',

  // Interactive
  accent: '#1A73E8',
  accentBg: '#E8F0FE',

  // Dividers & borders
  divider: '#E0E0E0',
  border: '#E0E0E0',

  // Checkbox
  checkboxUnchecked: '#5F6368',
  checkboxChecked: '#1A73E8',

  // Google Keep note colors (Light variants)
  noteColors: {
    default: '#FFFFFF',
    red: '#F28B82',
    pink: '#F29FBF',
    orange: '#FBBC04',
    yellow: '#FFF475',
    teal: '#CCFF90',
    blue: '#CBF0F8',
    dark_blue: '#AECBFA',
    purple: '#D7AEFB',
    gray: '#E6C9A8',
  } as Record<NoteColor, string>,
};

export type ThemeColors = typeof dark;
