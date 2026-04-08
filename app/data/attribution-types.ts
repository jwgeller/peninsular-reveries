export interface AttributionEntry {
  readonly title: string
  readonly type: 'music' | 'sound effect' | 'image' | 'illustration' | 'font' | 'other'
  readonly usedIn: string
  readonly creator: string
  readonly source: string
  readonly sourceUrl?: string
  readonly license: string
  readonly licenseUrl?: string
  readonly modifications: string
  readonly notes?: string
}

export interface GameAttribution {
  readonly slug: string
  readonly name: string
  readonly codeLicense: string
  readonly entries: readonly AttributionEntry[]
}

export interface GameInfo {
  readonly summary: string
}

export const attributionsPagePath = '/attributions/'
export const repositoryCodeLicense = 'GPL-3.0'
