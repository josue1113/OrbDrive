const CACHE_NAME = 'orbdrive-v1';
const urlsToCache = [
  '/',
  '/admin',
  '/motorista',
  '/login',
  '/manifest.json',
  '/offline.html'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se encontrado
        if (response) {
          return response;
        }
        
        // Fazer requisição de rede
        return fetch(event.request).catch(() => {
          // Se offline, retornar página offline para navegação
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Background Sync para sincronização de dados offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-location') {
    event.waitUntil(syncLocationData());
  }
});

// Função para sincronizar dados de localização quando voltar online
async function syncLocationData() {
  try {
    // Verificar se há dados pendentes no IndexedDB
    const pendingLocations = await getPendingLocations();
    
    for (const location of pendingLocations) {
      try {
        await sendLocationToServer(location);
        await removePendingLocation(location.id);
      } catch (error) {
        console.error('Erro ao sincronizar localização:', error);
      }
    }
  } catch (error) {
    console.error('Erro no background sync:', error);
  }
}

// Push notifications para alertas importantes
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do OrbDrive',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('OrbDrive', options)
  );
});

// Ações das notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic Background Sync (experimental)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'background-location-sync') {
    event.waitUntil(syncLocationData());
  }
});

// Message handling entre o app e o service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_LOCATION') {
    event.waitUntil(cacheLocationData(event.data.location));
  }
});

// Função para armazenar dados de localização offline
async function cacheLocationData(locationData) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['locations'], 'readwrite');
    const store = transaction.objectStore('locations');
    await store.add({
      ...locationData,
      timestamp: Date.now(),
      synced: false
    });
  } catch (error) {
    console.error('Erro ao armazenar localização offline:', error);
  }
}

// Abrir IndexedDB para armazenamento offline
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OrbDriveDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('locations')) {
        const store = db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

// Obter localizações pendentes de sincronização
async function getPendingLocations() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['locations'], 'readonly');
    const store = transaction.objectStore('locations');
    const index = store.index('synced');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao obter localizações pendentes:', error);
    return [];
  }
}

// Enviar localização para o servidor
async function sendLocationToServer(location) {
  const response = await fetch('/api/locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(location)
  });
  
  if (!response.ok) {
    throw new Error('Falha ao enviar localização');
  }
  
  return response.json();
}

// Remover localização após sincronização bem-sucedida
async function removePendingLocation(id) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['locations'], 'readwrite');
    const store = transaction.objectStore('locations');
    await store.delete(id);
  } catch (error) {
    console.error('Erro ao remover localização sincronizada:', error);
  }
} 