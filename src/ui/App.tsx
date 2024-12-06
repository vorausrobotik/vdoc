import MenuBar from './MenuBar'
import DocuCanvas from './DocuCanvas'

import { Box } from '@mui/material'

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <MenuBar />
      <DocuCanvas />
    </Box>
  )
}

export default App
