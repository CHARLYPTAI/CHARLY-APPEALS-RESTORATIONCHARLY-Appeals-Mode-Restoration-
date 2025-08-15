#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import path from 'path';

function generateSimpleSBOM() {
  console.log('🔍 Generating Software Bill of Materials (SBOM)...');
  
  try {
    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'reports');
    mkdirSync(reportsDir, { recursive: true });
    
    // Get dependency list using pnpm
    let dependencyData;
    try {
      const pnpmOutput = execSync('pnpm list --json --depth=0', { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      dependencyData = JSON.parse(pnpmOutput);
    } catch (error) {
      console.warn('⚠️  Failed to get pnpm dependencies, generating minimal SBOM');
      dependencyData = [];
    }
    
    // Read package.json files to get component info
    const rootPackageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    
    // Generate simplified SBOM in CycloneDX format
    const sbom = {
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      serialNumber: `urn:uuid:${generateUUID()}`,
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [
          {
            vendor: 'CHARLY',
            name: 'custom-sbom-generator',
            version: '1.0.0'
          }
        ],
        component: {
          type: 'application',
          'bom-ref': 'charly-app',
          name: rootPackageJson.name || 'charly-monorepo',
          version: rootPackageJson.version || '0.1.0',
          description: rootPackageJson.description || 'CHARLY property tax appeal application'
        }
      },
      components: []
    };
    
    // Add dependencies to components
    if (Array.isArray(dependencyData)) {
      dependencyData.forEach(workspace => {
        if (workspace.dependencies) {
          Object.entries(workspace.dependencies).forEach(([name, info]) => {
            sbom.components.push({
              type: 'library',
              'bom-ref': `${name}@${info.version}`,
              name: name,
              version: info.version,
              scope: info.dev ? 'optional' : 'required',
              purl: `pkg:npm/${name}@${info.version}`
            });
          });
        }
      });
    }
    
    // Write SBOM file
    const sbomPath = path.join(reportsDir, 'sbom.cdx.json');
    writeFileSync(sbomPath, JSON.stringify(sbom, null, 2));
    
    console.log(`📄 SBOM generated: ${sbomPath}`);
    console.log(`📊 Components catalogued: ${sbom.components.length}`);
    console.log('✅ SBOM generation completed successfully');
    
  } catch (error) {
    console.error('❌ SBOM generation failed:', error.message);
    console.log('📝 Creating minimal SBOM as fallback...');
    
    // Create minimal fallback SBOM
    const fallbackSBOM = {
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      serialNumber: `urn:uuid:${generateUUID()}`,
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [{ vendor: 'CHARLY', name: 'fallback-sbom-generator', version: '1.0.0' }],
        component: { type: 'application', name: 'charly-app', version: '0.1.0' }
      },
      components: []
    };
    
    const reportsDir = path.join(process.cwd(), 'reports');
    mkdirSync(reportsDir, { recursive: true });
    const sbomPath = path.join(reportsDir, 'sbom.cdx.json');
    writeFileSync(sbomPath, JSON.stringify(fallbackSBOM, null, 2));
    console.log(`📄 Fallback SBOM created: ${sbomPath}`);
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSimpleSBOM();
}