/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Testimonial {
  name: string;
  text: string;
  role: string;
}

export type PageType = 'lp' | 'chat';

export interface ChatOption {
  label: string;
  value: string;
  imageUrl?: string;
  nextStepId?: string;
}

export interface ChatStep {
  id: string;
  type: 'text' | 'image_options' | 'listbox' | 'media' | 'buttons' | 'link';
  message: string;
  options?: ChatOption[];
  mediaUrl?: string;
  mediaType?: 'audio' | 'video';
  multiSelect?: boolean;
  nextStepId?: string;
  validationType?: 'none' | 'name' | 'email' | 'phone';
  linkUrl?: string;
  linkLabel?: string;
}

export interface ChatConfig {
  contactName: string;
  contactPhotoUrl?: string;
  backgroundImageUrl?: string;
  steps: ChatStep[];
}

export interface ChatHistoryItem {
  role: 'bot' | 'user';
  message: string;
  timestamp: string;
}

export interface LandingPageConfig {
  id?: string;
  type?: PageType; // Adicionado para distinguir entre LP e Chat
  academyName: string;
  logoUrl?: string;
  slug: string; // cidade-modalidade
  city: string;
  modality: string;
  title: string;
  description: string;
  ctaText: string;
  whatsappNumber: string;
  webhookUrl?: string;
  showForm: boolean;
  videoUrl?: string;
  images: string[];
  testimonials: Testimonial[];
  primaryColor: string;
  campaignCode: string;
  updatedAt: any;
  chatConfig?: ChatConfig; // Configuração específica para o fluxo de chat
  theme?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  vslEnabled?: boolean;
  vslVideoUrl?: string;
  vslAutoSkipSeconds?: number;
  vslHeadline?: string;
  vslSubheadline?: string;
  vslCtaText?: string;
  vslUnlockType?: 'seconds' | 'end';
  // New section titles and texts
  heroSubtitle?: string;
  formTitle?: string;
  formBadge?: string;
  sectionVideoTitle?: string;
  sectionImagesTitle?: string;
  sectionImagesSubtitle?: string;
  sectionImagesDescription?: string;
  sectionTestimonialsTitle?: string;
  heroStats?: { value: string; label: string }[];
}

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  modality: string;
  campaignCode: string;
  createdAt: any;
  protocol?: string;
  chatHistory?: ChatHistoryItem[];
  type?: PageType;
}
