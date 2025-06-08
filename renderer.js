

// renderer.js
window.addEventListener('DOMContentLoaded', () => {
    const chooseBtn = document.getElementById('choose-folder');
    const createBtn = document.getElementById('create-folder');
    const searchInput = document.getElementById('search');
    const folderLabel = document.getElementById('current-folder');
    const grid = document.getElementById('grid');
    const newProjDialog = document.getElementById('new-project-dialog');
    const newProjInput = document.getElementById('new-project-name');
    const cancelBtn = document.getElementById('cancel-new-project');
    const confirmBtn = document.getElementById('confirm-new-project');
    let currentFolder = null;
    let allProjects = [];

    const saved = localStorage.getItem('projectFolder');
    if (saved) {
        currentFolder = saved;
        folderLabel.textContent = saved;
        refreshGrid();
    }

    chooseBtn.addEventListener('click', async () => {
        const folder = await window.api.selectFolder();
        if (!folder) return;
        currentFolder = folder;
        localStorage.setItem('projectFolder', folder);
        folderLabel.textContent = folder;
        refreshGrid();
    });

    createBtn.addEventListener('click', () => {
        if (!currentFolder) return;
        newProjInput.value = '';
        newProjDialog.showModal();
    });

    cancelBtn.addEventListener('click', () => newProjDialog.close());

    confirmBtn.addEventListener('click', async () => {
        const name = newProjInput.value.trim();
        if (name) await window.api.createFolder(currentFolder, name);
        newProjDialog.close();
        refreshGrid();
    });

    async function refreshGrid() {
        console.log('👉 refreshGrid: fetching projects for', currentFolder);
        allProjects = await window.api.listProjects(currentFolder || '');
        console.log('👈 refreshGrid: received projects:', allProjects);
        renderGrid(allProjects);
    }

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        const filtered = allProjects.filter(p => p.name.toLowerCase().includes(q));
        renderGrid(filtered);
    });

    function renderGrid(list) {
        console.log('renderGrid: rendering', list.length, 'projects');
        grid.innerHTML = '';
        list.forEach(({ name, projectPath, htmlPath, tags }) => {
            console.log(`-- Project "${name}" has tags:`, tags);
            const card = document.createElement('div');
            card.className = 'card';
            // render tags
            // drop any tag named “projects” (case‐insensitive)
            const filteredTags = (tags || []).filter(t => t.toLowerCase() !== 'projects');
            const tagSpans = filteredTags
                .map(t => `<span class="tag">${t}</span>`)
                .join(' ');
            card.innerHTML = `
        <h3>${name.replace('prj_', '')} ${tagSpans}</h3>
         <button class="btn-browser" ${!htmlPath ? 'disabled' : ''}>Browser <i class="fa-brands fa-firefox-browser"></i></button>
        <button class="btn-vscode">Code <i class="fa-solid fa-code"></i></button>
      `;
            const [btnBrowser, btnVscode] = card.querySelectorAll('button');
            if (htmlPath) btnBrowser.addEventListener('click', () => window.api.openInBrowser(htmlPath));
            btnVscode.addEventListener('click', () => window.api.openInVSCode(projectPath));
            grid.appendChild(card);
        });
    }
});
