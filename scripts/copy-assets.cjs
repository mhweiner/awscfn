const {copyFileSync, mkdirSync, existsSync, readdirSync} = require('node:fs');
const {join, dirname} = require('node:path');

const srcDir = 'src';
const distDir = 'dist';

function copyNonTsFiles(dir) {

    const entries = readdirSync(dir, {withFileTypes: true});

    for (const entry of entries) {

        const srcPath = join(dir, entry.name);
        const distPath = srcPath.replace(srcDir, distDir);

        if (entry.isDirectory()) {

            copyNonTsFiles(srcPath);

        } else if (!entry.name.endsWith('.ts')) {

            const destDir = dirname(distPath);

            if (!existsSync(destDir)) {

                mkdirSync(destDir, {recursive: true});

            }
            copyFileSync(srcPath, distPath);
            console.log(`Copied: ${srcPath} -> ${distPath}`);

        }

    }

}

copyNonTsFiles(srcDir);
console.log('Assets copied successfully');
