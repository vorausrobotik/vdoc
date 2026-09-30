import LabelIcon from '@mui/icons-material/Label'
import LabelOffIcon from '@mui/icons-material/LabelOff'
import { alpha, Box, Chip, type ChipProps, Stack, Typography, useTheme } from '@mui/material'
import { type RaRecord, useRecordContext } from 'react-admin'
import type { ProjectCategory, ProjectVisibility } from '../interfacesAndTypes/Project'
import { categoryHue } from './categoryColors'
import { VISIBILITY_CHOICES, type VisibilityChoice } from './visibility'

/**
 * Every chip of the admin pages: a tint of its color behind text and icon in that color, with the
 * icon sized to the label.
 */
const TonalChip = ({ color, ...props }: Omit<ChipProps, 'color'> & { color: string }) => (
  <Chip
    size="small"
    sx={{
      color,
      bgcolor: alpha(color, 0.14),
      fontWeight: 500,
      '& .MuiChip-icon': { color, fontSize: 16, ml: 0.75, mr: -0.25 },
      '& .MuiChip-label': { px: 1 },
    }}
    {...props}
  />
)

// Wide enough for the widest chip, so the descriptions beside them start in one column
const OPTION_CHIP_WIDTH = 104

export const VisibilityChip = ({ visibility }: { visibility: ProjectVisibility }) => {
  const theme = useTheme()
  const { name, color, Icon } = VISIBILITY_CHOICES.find((choice) => choice.id === visibility) ?? VISIBILITY_CHOICES[0]
  return <TonalChip color={theme.palette[color].main} icon={<Icon />} label={name} />
}

/** A visibility as an option of a select: its chip, and what it means. */
export const VisibilityOption = () => {
  const choice = useRecordContext<VisibilityChoice>()
  if (!choice) {
    return null
  }
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: OPTION_CHIP_WIDTH, flexShrink: 0 }}>
        <VisibilityChip visibility={choice.id} />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {choice.description}
      </Typography>
    </Stack>
  )
}

/** A category in the color it is always shown in, or Misc for a project without one. */
export const CategoryChip = ({ category }: { category?: ProjectCategory }) => {
  const theme = useTheme()
  if (!category) {
    return <TonalChip color={theme.palette.text.secondary} icon={<LabelOffIcon />} label="Misc" />
  }
  // A lighter shade on a dark background and a darker one on a light background, so both read well
  const color = categoryHue(category.id)[theme.palette.mode === 'dark' ? 300 : 700]
  return <TonalChip color={color} icon={<LabelIcon />} label={category.name} />
}

/** A category as an option of the autocomplete. */
export const CategoryOption = () => {
  const category = useRecordContext<ProjectCategory & RaRecord>()
  if (!category) {
    return null
  }
  // The option that creates a category carries react-admin's own id and its label as the name
  if (String(category.id).startsWith('@@ra-create')) {
    return <Typography variant="body2">{category.name}</Typography>
  }
  return <CategoryChip category={category} />
}
