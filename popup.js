function getStorage() {
  return chrome.storage.sync || chrome.storage.local;
}

function isRootFolder(folderId) {
  return ["0", "1", "2", "3"].includes(folderId);
}

document.addEventListener("DOMContentLoaded", () => {
  const folderSelect = document.getElementById("folderSelect");
  const saveButton = document.getElementById("saveButton");
  const exportButton = document.getElementById("exportButton");
  const importButton = document.getElementById("importButton");
  const createButton = document.getElementById("createFolderButton");
  const deleteButton = document.getElementById("deleteFolderButton");
  const emptyTrashButton = document.getElementById("emptyTrashButton");

  function updateTrashButtonVisibility() {
    chrome.bookmarks.getTree((nodes) => {
      let found = false;

      function searchTrash(nodes) {
        for (const node of nodes) {
          const isTrash = node.title.toLowerCase() === "trash" || node.title.toLowerCase() === "papierkorb";
          if (isTrash && node.children && node.children.length > 0) {
            found = true;
            break;
          }
          if (node.children) {
            searchTrash(node.children);
          }
        }
      }

      searchTrash(nodes);
      emptyTrashButton.style.display = found ? "block" : "none";
    });
  }

  chrome.bookmarks.getTree((nodes) => {
    folderSelect.innerHTML = "";

    function addFolders(items, depth = 0) {
      for (const node of items) {
        if (node.children) {
          const option = document.createElement("option");
          option.value = node.id;
          option.textContent = " ".repeat(depth * 2) + (node.title || "Unbenannt");
          folderSelect.appendChild(option);
          addFolders(node.children, depth + 1);
        }
      }
    }

    addFolders(nodes);

    getStorage().get("selectedFolderId", (result) => {
      if (result.selectedFolderId) {
        folderSelect.value = result.selectedFolderId;
      }
    });

    updateTrashButtonVisibility();
  });

  saveButton.addEventListener("click", () => {
    getStorage().set({ selectedFolderId: folderSelect.value }, () => {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Gespeichert",
        message: "✅ Ordner gespeichert!",
        priority: 2
      }, () => {
        window.close();
      });
    });
  });

  exportButton.addEventListener("click", () => {
    getStorage().get("selectedFolderId", (result) => {
      const data = JSON.stringify(result);
      navigator.clipboard.writeText(data).then(() => {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Exportiert",
          message: "📋 Einstellungen wurden in die Zwischenablage kopiert!",
          priority: 2
        });
      });
    });
  });

  importButton.addEventListener("click", () => {
    const input = prompt("📥 Füge hier deine exportierten Einstellungen ein:");
    try {
      const data = JSON.parse(input);
      if (data.selectedFolderId) {
        getStorage().set({ selectedFolderId: data.selectedFolderId }, () => {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "Importiert",
            message: "✅ Einstellungen importiert!",
            priority: 2
          });
          folderSelect.value = data.selectedFolderId;
        });
      } else {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Fehler",
          message: "⚠️ Keine gültigen Einstellungen gefunden.",
          priority: 2
        });
      }
    } catch (e) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Import-Fehler",
        message: "❌ Ungültiges JSON.",
        priority: 2
      });
    }
  });

  createButton?.addEventListener("click", () => {
    const name = prompt("Neuen Ordnernamen eingeben:");
    if (!name) return;

    chrome.bookmarks.create({ parentId: "1", title: name }, (newFolder) => {
      const option = document.createElement("option");
      option.value = newFolder.id;
      option.textContent = name;
      folderSelect.appendChild(option);
      folderSelect.value = newFolder.id;

      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Ordner erstellt",
        message: `🎉 Neuer Ordner "${name}" wurde erstellt!`,
        priority: 2
      });
    });
  });

  deleteButton?.addEventListener("click", () => {
    const folderId = folderSelect.value;
    if (!folderId || isRootFolder(folderId)) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Fehler",
        message: "❌ Dieser Ordner kann nicht gelöscht werden.",
        priority: 2
      });
      return;
    }

    if (confirm("Diesen Ordner wirklich löschen?")) {
      chrome.bookmarks.removeTree(folderId, () => {
        const optionToRemove = folderSelect.querySelector(`option[value="${folderId}"]`);
        if (optionToRemove) {
          optionToRemove.remove();
        }
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Ordner gelöscht",
          message: "🗑️ Der Ordner wurde gelöscht.",
          priority: 2
        });
      });
    }
  });

  emptyTrashButton?.addEventListener("click", () => {
    chrome.bookmarks.getTree((nodes) => {
      function findAndDeleteTrashItems(nodes) {
        for (const node of nodes) {
          const isTrash = node.title.toLowerCase() === "trash" || node.title.toLowerCase() === "papierkorb";
          if (isTrash && node.children) {
            for (const child of node.children) {
              chrome.bookmarks.removeTree(child.id);
            }
          }
          if (node.children) {
            findAndDeleteTrashItems(node.children);
          }
        }
      }

      findAndDeleteTrashItems(nodes);

      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Papierkorb geleert",
        message: "🧹 Papierkorb wurde geleert.",
        priority: 2
      });

      updateTrashButtonVisibility();
    });
  });
});
