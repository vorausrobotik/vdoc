import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { SelectChangeEvent } from '@mui/material/Select'
import { Chip } from '@mui/material'

interface VersionDropdownProps extends React.ComponentProps<'div'> {
  selectedVersion: string
  latestVersion: string
  versions: string[]
  numVersionsPreview?: number
  onVersionChange: (event: SelectChangeEvent) => void
}

export default function VersionDropdown({
  selectedVersion,
  latestVersion,
  versions,
  numVersionsPreview = 5,
  onVersionChange,
  ...divProps
}: VersionDropdownProps) {
  const numVersions = versions?.length
  const renderVersion = (version: string) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span>{version}</span>
      {latestVersion && latestVersion == version && (
        <Chip label="latest" size="small" color="success" style={{ marginLeft: 8 }} />
      )}
    </div>
  )
  return (
    <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
      <InputLabel>Version</InputLabel>
      <Select
        id={divProps.id}
        value={selectedVersion === 'latest' ? latestVersion : selectedVersion}
        onChange={onVersionChange}
        renderValue={renderVersion}
        label="Version"
      >
        {versions
          ? [...versions]
              .reverse()
              .slice(0, numVersionsPreview)
              .map((version) => (
                <MenuItem key={version} value={version}>
                  {renderVersion(version)}
                </MenuItem>
              ))
          : null}{' '}
        {numVersions && numVersions > numVersionsPreview && (
          <MenuItem key="more" value="more">
            ...more
          </MenuItem>
        )}
      </Select>
    </FormControl>
  )
}
