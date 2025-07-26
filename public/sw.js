const CACHE_NAME = 'rastreamento-motoristas-v1';
const urlsToCache = [
  '/',
  '/motorista',
  '/admin',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Arquivos em cache');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Erro ao fazer cache:', error);
      })
  );
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Ativado');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Só lidar com requisições GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para APIs externas e Supabase
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('google.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se encontrou no cache, retorna
        if (response) {
          console.log('Service Worker: Servindo do cache:', event.request.url);
          return response;
        }

        // Senão, busca na rede
        console.log('Service Worker: Buscando na rede:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta para o cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Erro na rede:', error);
            
            // Se for uma página HTML, retorna a página offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/') || new Response(
                `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Offline - Rastreamento</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      min-height: 100vh;
                      margin: 0;
                      padding: 20px;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      text-align: center;
                    }
                    .offline-icon {
                      font-size: 4rem;
                      margin-bottom: 1rem;
                    }
                    h1 {
                      margin: 0 0 1rem 0;
                      font-size: 2rem;
                      font-weight: 300;
                    }
                    p {
                      margin: 0 0 2rem 0;
                      opacity: 0.8;
                      max-width: 400px;
                      line-height: 1.5;
                    }
                    button {
                      background: rgba(255, 255, 255, 0.2);
                      border: 2px solid rgba(255, 255, 255, 0.3);
                      color: white;
                      padding: 12px 24px;
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 1rem;
                      transition: all 0.3s ease;
                    }
                    button:hover {
                      background: rgba(255, 255, 255, 0.3);
                      border-color: rgba(255, 255, 255, 0.5);
                    }
                  </style>
                </head>
                <body>
                  <div class="offline-icon">📶</div>
                  <h1>Você está offline</h1>
                  <p>Verifique sua conexão com a internet e tente novamente. Algumas funcionalidades podem estar limitadas no modo offline.</p>
                  <button onclick="window.location.reload()">Tentar Novamente</button>
                </body>
                </html>
                `,
                {
                  status: 200,
                  statusText: 'OK',
                  headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                  },
                }
              );
            }
            
            // Para outros tipos de arquivos, retorna erro
            return new Response('Sem conexão', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });
      })
  );
});

// Listener para mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('Service Worker: Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Sincronização em background (para dados offline)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sincronização em background:', event.tag);
  
  if (event.tag === 'background-sync-positions') {
    event.waitUntil(syncPositions());
  }
});

// Função para sincronizar posições quando voltar online
async function syncPositions() {
  try {
    // Buscar dados pendentes no IndexedDB
    const pendingData = await getPendingPositions();
    
    if (pendingData.length > 0) {
      console.log('Service Worker: Sincronizando', pendingData.length, 'posições');
      
      // Enviar dados para o servidor
      for (const position of pendingData) {
        try {
          await fetch('/api/positions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(position),
          });
          
          // Remover da lista de pendentes se enviado com sucesso
          await removePendingPosition(position.id);
        } catch (error) {
          console.error('Service Worker: Erro ao sincronizar posição:', error);
        }
      }
      
      console.log('Service Worker: Sincronização concluída');
    }
  } catch (error) {
    console.error('Service Worker: Erro na sincronização:', error);
  }
}

// Funções auxiliares para IndexedDB (seriam implementadas em um arquivo separado)
async function getPendingPositions() {
  // Implementação do IndexedDB para buscar dados pendentes
  return [];
}

async function removePendingPosition(id) {
  // Implementação do IndexedDB para remover dados sincronizados
  return true;
}

// Notificação de atualização disponível
self.addEventListener('controllerchange', () => {
  console.log('Service Worker: Nova versão ativa');
});

console.log('Service Worker: Carregado e pronto!'); 