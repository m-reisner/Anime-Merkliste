chrome.runtime.onInstalled.addListener(() => {
  // Benachrichtigung nach der Installation anzeigen
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Anime Bookmark Extension installiert!',
    message: 'Klicke auf das Erweiterungssymbol und wähle einen Ordner, um die Erweiterung zu konfigurieren.',
    priority: 2
  });

  // Kontextmenü erstellen
  chrome.contextMenus.create({
    id: "animeBookmark",
    title: "Anime merken",
    contexts: ["all"]
  });
});

// Event Listener für das Klicken im Kontextmenü
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "animeBookmark") {
    if (!info.selectionText) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Fehlende Auswahl',
        message: '❗ Bitte markiere einen Text, um ihn als Titel zu verwenden.',
        priority: 2
      });
      return;
    }

    // Versuche sync, fallback auf local
    chrome.storage.sync.get("selectedFolderId", (result) => {
      let folderId = result?.selectedFolderId;
      if (!folderId) {
        // fallback auf local
        chrome.storage.local.get("selectedFolderId", (localResult) => {
          folderId = localResult?.selectedFolderId;
          if (!folderId) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'Kein Ordner gewählt',
              message: '❗ Bitte wähle zuerst in den Erweiterungseinstellungen einen Ordner aus.',
              priority: 2
            });
            return;
          }

          speichereLesezeichen(folderId, info);
        });
      } else {
        speichereLesezeichen(folderId, info);
      }
    });
  }
});

function speichereLesezeichen(folderId, info) {
  chrome.bookmarks.create({
    parentId: folderId,
    title: info.selectionText,
    url: info.pageUrl
  }, () => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Lesezeichen gespeichert!',
      message: 'Das Anime wurde erfolgreich als Lesezeichen gespeichert.',
      priority: 2
    });
  });
}
