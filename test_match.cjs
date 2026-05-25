const fs = require('fs');
const files = [
  'src/components/BulkExportModal.jsx',
  'src/components/EventSimulationModal.jsx',
  'src/components/MoodConfigModal.jsx',
  'src/components/PromptPreview.jsx'
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('<button className="modal-close" onClick={onClose}>×</button>')) {
    console.log(`${file} matches`);
  } else {
    console.log(`${file} NO MATCH`);
  }
});
