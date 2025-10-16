export type LevelId = 'house' | 'district' | 'village' | 'state' | 'country' | 'world';

export const LEVELS: Record<LevelId, { scale: number; order: number; name: string }> = {
  house: { scale: 1.2, order: 0, name: 'House' },
  district: { scale: 0.8, order: 1, name: 'District' },
  village: { scale: 0.55, order: 2, name: 'Village' },
  state: { scale: 0.35, order: 3, name: 'State' },
  country: { scale: 0.2, order: 4, name: 'Country' },
  world: { scale: 0.08, order: 5, name: 'World' }
};

export const LEVEL_SEQUENCE: LevelId[] = ['house','district','village','state','country','world'];
