export type SteamGameData = {
  type: string;
  name: string;
  steam_appid: number;
  required_age: number;
  is_free: boolean;
  detailed_description: string;
  about_the_game: string;
  short_description: string;
  fullgame: Fullgame;
  header_image: string;
  website: any;
  pc_requirements: PcRequirements;
  mac_requirements: any[];
  linux_requirements: any[];
  developers: string[];
  publishers: string[];
  package_groups: any[];
  platforms: Platforms;
  categories: Category[];
  screenshots: Screenshot[];
  release_date: ReleaseDate;
  support_info: SupportInfo;
  background: string;
  background_raw: string;
  content_descriptors: ContentDescriptors;
};

export type Fullgame = {
  appid: string;
  name: string;
};

export type PcRequirements = {
  minimum: string;
};

export type Platforms = {
  windows: boolean;
  mac: boolean;
  linux: boolean;
};

export type Category = {
  id: number;
  description: string;
};

export type Screenshot = {
  id: number;
  path_thumbnail: string;
  path_full: string;
};

export type ReleaseDate = {
  coming_soon: boolean;
  date: string;
};

export type SupportInfo = {
  url: string;
  email: string;
};

export type ContentDescriptors = {
  ids: any[];
  notes: any;
};
