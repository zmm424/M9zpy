const CACHE_NAME = '497group-v1';
const urlsToCache = [
  '/',
  '/messages.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

let isTaskRunning = false;
let taskInterval = null;

self.addEventListener('message', function(event) {
  const data = event.data;
  
  if (data.type === 'START_TASK') {
    if (isTaskRunning) {
      return;
    }
    
    isTaskRunning = true;
    const taskData = data.data;
    let messageIndex = 0;
    
    taskInterval = setInterval(async () => {
      for (const token of taskData.tokens) {
        try {
          let message;
          if (taskData.type === "random") {
            const randomIndex = Math.floor(Math.random() * taskData.messages.length);
            message = taskData.mentions 
              ? `${taskData.messages[randomIndex]} ${taskData.mentions}` 
              : taskData.messages[randomIndex];
          } else {
            message = taskData.mentions 
              ? `${taskData.messages[messageIndex % taskData.messages.length]} ${taskData.mentions}` 
              : taskData.messages[messageIndex % taskData.messages.length];
          }
          
          const response = await fetch(`https://discord.com/api/v9/channels/${taskData.channelId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: message })
          });
          
          if (!response.ok) {
            console.error(`Failed to send message with token: ${token.slice(0, 15)}...`);
          }
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
      
      messageIndex++;
    }, taskData.delay);
    
  } else if (data.type === 'STOP_TASK') {
    if (taskInterval) {
      clearInterval(taskInterval);
      taskInterval = null;
    }
    isTaskRunning = false;
  }
});
