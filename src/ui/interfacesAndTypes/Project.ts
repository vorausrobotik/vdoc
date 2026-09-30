export type ProjectVisibility = 'listed' | 'unlisted' | 'locked'

export interface ProjectVersion {
  version: string
  published_at: string
}

export interface Project {
  name: string
  display_name: string | null
  description: string | null
  category_id: number | null
  visibility: ProjectVisibility
  /** Oldest first, so the newest is last. */
  versions: ProjectVersion[]
}

export interface ProjectCategory {
  id: number
  name: string
}
