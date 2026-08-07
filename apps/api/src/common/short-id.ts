import * as shortUUID from 'short-uuid';
import { Component } from 'src/entities/project/component.entity';

const translator = shortUUID();

/**
 * Converts a UUID to a shorter, URL-friendly ID
 * @param uuid The UUID to convert
 * @returns A short ID
 */
export function uuidToShortId(uuid: string): string {
  return translator.fromUUID(uuid);
}

/**
 * Converts a short ID back to its original UUID
 * @param shortId The short ID to convert
 * @returns The original UUID
 */
export function shortIdToUuid(shortId: string): string {
  return translator.toUUID(shortId);
}

export const slugify = (text) => {
  if (!text) return '';

  const slug = String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, '-and-')
    .replace(/[_\s/+–—―]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return slug;
};
export function batchProcessIds(
  components: Component[],
  batchSize: number = 1000,
): object[] {
  const results: object[] = [];

  for (let i = 0; i < components.length; i += batchSize) {
    const batch = components.slice(i, i + batchSize);
    const batchResults = batch.map((component) => {
      return {
        id: translator.fromUUID(component.id),
        slug: slugify(component.name),
      } as object;
    });
    results.push(...batchResults);
  }

  return results;
}
