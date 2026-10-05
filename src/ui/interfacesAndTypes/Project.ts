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
  /** Offered on the landing page as the project to start with. At most one project is. */
  featured: boolean
  /** The text of the start button. Unset, the site plugin words it itself. */
  featured_label: string | null
  /** Oldest first, so the newest is last. */
  versions: ProjectVersion[]
}

export interface ProjectCategory {
  id: number
  name: string
}
