import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { SelectChangeEvent } from '@mui/material/Select'

interface VersionDropdownProps extends React.ComponentProps<'div'> {
  selectedVersion: string
  versions: string[] | null
  onVersionChange: (event: SelectChangeEvent) => void
}

export default function VersionDropdown(props: VersionDropdownProps) {
  return (
    <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
      <InputLabel>Version</InputLabel>
      <Select id={props.id} value={props.selectedVersion} onChange={props.onVersionChange} label="Version">
        <MenuItem key="latest" value="latest">
          latest
        </MenuItem>
        {props.versions
          ? [...props.versions]
              .reverse()
              .slice(0, 5)
              .map((version) => (
                <MenuItem key={version} value={version}>
                  {version}
                </MenuItem>
              ))
          : null}{' '}
        // Handle the case where versions is null
        <MenuItem key="more" value="more">
          ...more
        </MenuItem>
      </Select>
    </FormControl>
  )
}
