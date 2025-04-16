function getStorage() {
  return chrome.storage.sync || chrome.storage.local;
}

document.addEventListener("DOMContentLoaded", () => {
  const folderSelect = document.getElementById("folderSelect");
  const saveButton = document.getElementById("saveButton");
  const exportButton = document.getElementById("exportButton");
  const importButton = document.getElementById("importButton");
  const clearTrashButton = document.getElementById("clearTrashButton");

  chrome.bookmarks.getTree((nodes) => {
    folderSelect.innerHTML = "";

    function addFolders(items, depth = 0) {
      for (const node of items) {
        if (node.children) {
          const option = document.createElement("option");
          option.value = node.id;
          option.textContent = " ".repeat(depth * 2) + node.title || "Unbenannt";
          folderSelect.appendChild(option);
          addFolders(node.children, depth + 1);
        }
      }
    }

    addFolders(nodes);

    // Auswahl wiederherstellen
    getStorage().get("selectedFolderId", (result) => {
      if (result.selectedFolderId) {
        folderSelect.value = result.selectedFolderId;
      }
    });
  });

  saveButton.addEventListener("click", () => {
    getStorage().set({ selectedFolderId: folderSelect.value }, () => {
      alert("✅ Ordner gespeichert!");
    });
  });

  exportButton.addEventListener("click", () => {
    getStorage().get("selectedFolderId", (result) => {
      const data = JSON.stringify(result);
      navigator.clipboard.writeText(data).then(() => {
        alert("📋 Einstellungen wurden in die Zwischenablage kopiert!");
      });
    });
  });

  importButton.addEventListener("click", () => {
    const input = prompt("📥 Füge hier deine exportierten Einstellungen ein:");
    try {
      const data = JSON.parse(input);
      if (data.selectedFolderId) {
        getStorage().set({ selectedFolderId: data.selectedFolderId }, () => {
          alert("✅ Einstellungen importiert!");
          folderSelect.value = data.selectedFolderId;
        });
      } else {
        alert("⚠️ Keine gültigen Einstellungen gefunden.");
      }
    } catch (e) {
      alert("❌ Fehler beim Importieren: Ungültiges JSON.");
    }
  });

  // Papierkorb leeren Button aktivieren, wenn es Lesezeichen im Papierkorb gibt
  chrome.bookmarks.getTree((nodes) => {
    let hasTrash = false;
    function checkTrash(items) {
      for (const node of items) {
        if (node.title === "Papierkorb") {
          hasTrash = true;
          break;
        }
        if (node.children) {
          checkTrash(node.children);
        }
      }
    }

    checkTrash(nodes);

    if (hasTrash) {
      clearTrashButton.style.display = "block";
    }
  });

  // Papierkorb leeren
  clearTrashButton.addEventListener("click", () => {
    chrome.bookmarks.getTree((nodes) => {
      function deleteFromTrash(items) {
        items.forEach(item => {
          if (item.title === "Papierkorb" && item.children) {
            item.children.forEach(child => {
              chrome.bookmarks.remove(child.id);
            });
          }
          if (item.children) {
            deleteFromTrash(item.children);
          }
        });
      }

      deleteFromTrash(nodes);
      alert("🗑️ Papierkorb wurde geleert!");
    });
  });
});
