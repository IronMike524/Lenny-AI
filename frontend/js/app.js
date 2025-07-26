document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const API_URL = 'https://lenny-ai-a9dx.onrender.com'; // URL de prueba local

    // --- ELEMENTOS DEL DOM ---
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const messagesContainer = document.getElementById('messages');
    const typingIndicator = document.getElementById('typing-indicator');

    // --- FUNCIONES ---
    const addMessage = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('msg', sender);
        messageElement.textContent = text;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        const nombre = document.getElementById('nombre').value.trim();
        const cedula = document.getElementById('cedula').value.trim();

        if (!nombre || !cedula) {
            alert('Por favor, completa ambos campos.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, cedula }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('user_nombre', data.user.nombre);
                localStorage.setItem('user_cedula', data.user.cedula);
                loginOverlay.classList.add('hidden');
                chatContainer.classList.remove('hidden');
                addMessage(`Hola, ${data.user.nombre}. Soy Lenny AI. ¿En qué puedo ayudarte hoy?`, 'bot');
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo conectar con el servidor. Inténtalo más tarde.');
        }
    };

    const handleChatSubmit = async (event) => {
        event.preventDefault();
        const messageText = messageInput.value.trim();
        if (!messageText) return;

        const userCedula = localStorage.getItem('user_cedula');
        if (!userCedula) {
            alert('Error de sesión. Por favor, recarga la página.');
            return;
        }

        addMessage(messageText, 'user');
        messageInput.value = '';
        typingIndicator.classList.remove('hidden');

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cedula: userCedula, message: messageText }),
            });

            const data = await response.json();
            typingIndicator.classList.add('hidden');

            if (response.ok) {
                addMessage(data.response, 'bot');
            } else {
                addMessage(`Error: ${data.error || 'No se pudo obtener respuesta.'}`, 'bot');
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            typingIndicator.classList.add('hidden');
            addMessage('No se pudo conectar con el servidor. Verifica tu conexión.', 'bot');
        }
    };

    // --- LÓGICA DE INICIO ---
    const checkSession = () => {
        const userCedula = localStorage.getItem('user_cedula');
        const userNombre = localStorage.getItem('user_nombre');

        if (userCedula && userNombre) {
            loginOverlay.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            addMessage(`¡Hola de nuevo, ${userNombre}! ¿Cómo puedo asistirte?`, 'bot');
        }
    };

    // --- EVENT LISTENERS ---
    loginForm.addEventListener('submit', handleLogin);
    chatForm.addEventListener('submit', handleChatSubmit);

    // --- EJECUCIÓN INICIAL ---
    checkSession();
});