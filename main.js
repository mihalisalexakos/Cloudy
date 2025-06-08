
// main.js
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled) return null;
    return result.filePaths[0];
});

// Recursively find preferred HTML file in project
function findHtmlFile(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const indexEntry = entries.find(e => e.isFile() && e.name.toLowerCase() === 'index.html');
    if (indexEntry) return path.join(dir, indexEntry.name);
    const firstHtml = entries.find(e => e.isFile() && e.name.toLowerCase().endsWith('.html'));
    if (firstHtml) return path.join(dir, firstHtml.name);
    for (const e of entries) {
        if (e.isDirectory()) {
            const found = findHtmlFile(path.join(dir, e.name));
            if (found) return found;
        }
    }
    return null;
}

// Determine if a folder is a tag: any direct subfolder name includes 'prj'
function isTagFolder(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    // If any *direct* child folder has “prj” in its name, we treat this as a tag container:
    return entries.some(e =>
        e.isDirectory() &&
        e.name.toLowerCase().includes('prj')
    );
}

// Find project directories: name contains 'prj'
function findProjectDirs(dir) {
    let results = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        const fullPath = path.join(dir, e.name);
        if (e.name.toLowerCase().includes('prj')) {
            results.push(fullPath);
        } else {
            results = results.concat(findProjectDirs(fullPath));
        }
    }
    return results;
}

// List projects with tags
ipcMain.handle('list-projects', (event, folder) => {
    if (!folder) return [];
    const projects = [];
    function recurse(dir, parentTags) {
        console.log('[recurse] at dir:', dir, 'parentTags:', parentTags);
        const tagHere = isTagFolder(dir);
        const tags = tagHere ? parentTags.concat(path.basename(dir)) : parentTags;
        console.log('[recurse] tags for', dir, ':', tags);
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (!e.isDirectory()) continue;
            const fullPath = path.join(dir, e.name);
            if (e.name.toLowerCase().includes('prj')) {
                const htmlPath = findHtmlFile(fullPath);
                console.log('[list-projects] adding project:', fullPath, 'with tags:', tags);
                projects.push({
                    name: path.basename(fullPath),
                    projectPath: fullPath,
                    htmlPath,
                    tags
                });
            } else {
                recurse(fullPath, tags);
            }
        }
    }
    recurse(folder, []);
    console.log('[list-projects] final projects list:', projects);
    return projects;
});




ipcMain.handle('open-in-browser', (event, htmlPath) => {
    shell.openExternal(`file://${htmlPath}`);
});

ipcMain.handle('open-in-vscode', (event, projectPath) => {
    exec(`open -a "Visual Studio Code" "${projectPath}"`, (err) => {
        if (err) console.error('✖ Failed to launch VS Code:', err);
    });
});

ipcMain.handle('create-folder', (event, { parentDir, name }) => {
    const folderName = `prj_${name}`;
    const newDir = path.join(parentDir, folderName);
    fs.mkdirSync(newDir, { recursive: true });
    return newDir;
});
