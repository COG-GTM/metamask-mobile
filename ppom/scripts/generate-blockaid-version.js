const fs = require('fs');
const path = require('path');
const BlockaidPackage = require('@blockaid/ppom_release/package.json');

const outputPath = path.resolve(
  __dirname,
  '../../app/lib/ppom/blockaid-version.ts',
);

const content = `interface BlockaidVersionInfo {
  BlockaidVersion: string;
}

const blockaidVersionInfo: BlockaidVersionInfo = {
  BlockaidVersion: '${BlockaidPackage.version}',
};

export default blockaidVersionInfo;
`;

fs.writeFileSync(outputPath, content, 'utf8');
