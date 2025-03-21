export interface Project {
  name: string
  display_name: string
  category_id: number | null
}

export interface ProjectCategory {
  id: number
  name: string
}
