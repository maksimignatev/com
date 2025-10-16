// Stub hierarchical data; expand as needed.
export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Person {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface SimpleEntity {
  id: string;
  name: string;
  x: number;
  y: number;
}

export const WorldData = {
  house: {
    bounds: { x: -100, y: -60, w: 200, h: 120 } as Bounds,
    persons: [
      { id: "person_1", name: "Alice", x: -30, y: 0 },
      { id: "person_2", name: "Bob", x: 20, y: 10 }
    ] as Person[]
  },
  district: {
    bounds: { x: -800, y: -600, w: 1600, h: 1200 } as Bounds,
    houses: [{ id: "house_main", name: "Main House", x: 0, y: 0 }] as SimpleEntity[]
  },
  village: {
    bounds: { x: -1500, y: -1200, w: 3000, h: 2400 } as Bounds,
    districts: [{ id: "district_central", name: "Central District", x: 0, y: 0 }] as SimpleEntity[]
  },
  state: {
    bounds: { x: -3000, y: -2200, w: 6000, h: 4400 } as Bounds,
    villages: [{ id: "village_alpha", name: "Alpha Village", x: 0, y: 0 }] as SimpleEntity[]
  },
  country: {
    bounds: { x: -4500, y: -3600, w: 9000, h: 7200 } as Bounds,
    states: [{ id: "state_north", name: "North State", x: 0, y: 0 }] as SimpleEntity[]
  },
  world: {
    bounds: { x: -6000, y: -4800, w: 12000, h: 9600 } as Bounds,
    countries: [{ id: "country_demo", name: "Demo Country", x: 0, y: 0 }] as SimpleEntity[]
  }
};
