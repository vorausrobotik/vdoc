import { blue, blueGrey, brown, cyan, deepPurple, indigo, lightBlue, pink, purple, teal } from '@mui/material/colors'

/**
 * The hues categories are shown in, one per category by its id.
 *
 * Green, orange and red are left out, because they already say whether a project is listed,
 * unlisted or locked. Ten hues keep the first ten categories apart. After that they repeat.
 */
const CATEGORY_HUES = [blue, purple, teal, pink, indigo, cyan, deepPurple, lightBlue, brown, blueGrey]

export const categoryHue = (categoryId: number) => CATEGORY_HUES[categoryId % CATEGORY_HUES.length]
