/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Testimonial {
  name: string;
  text: string;
  role: string;
}

export interface LandingPageConfig {
  id?: string;
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
}
