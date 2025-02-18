import { Chip, MenuItem, Select, FormControl, InputLabel, SelectChangeEvent } from '@mui/material'
import testIDs from '../interfacesAndTypes/testIDs'

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
  const renderVersion = (version: string) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span>{version}</span>
      {latestVersion && latestVersion == version && (
        <Chip label="latest" size="small" color="success" style={{ marginLeft: 8 }} />
      )}
    </div>
  )
  const onChange = (event: SelectChangeEvent) => {
    if (event.target.value) {
      onVersionChange(event)
    }
  }
  return (
    <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
      <InputLabel>Version</InputLabel>
      <Select
        data-testid={testIDs.header.versionDropdown.main}
        id={divProps.id}
        value={selectedVersion === 'latest' ? latestVersion : selectedVersion}
        onChange={onChange}
        renderValue={renderVersion}
        label="Select version..."
        sx={{ minWidth: '160px', mr: 1 }}
      >
        <MenuItem key="empty" value="" data-testid={testIDs.header.versionDropdown.emptyItem}></MenuItem>
        {versions
          ? [...versions]
              .reverse()
              .slice(0, numVersionsPreview)
              .map((version) => (
                <MenuItem key={version} value={version} data-testid={testIDs.header.versionDropdown.item}>
                  {renderVersion(version)}
                </MenuItem>
              ))
          : null}
        <MenuItem key="all" value="all" data-testid={testIDs.header.versionDropdown.showAllItem}>
          ...show all
        </MenuItem>
      </Select>
    </FormControl>
  )
}
