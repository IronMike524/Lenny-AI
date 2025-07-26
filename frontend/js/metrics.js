document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    // !!! CAMBIA ESTA URL POR LA URL DE TU BACKEND EN RENDER !!!
    const API_URL = 'http://127.0.0.1:5000'; // URL de prueba local

    // --- ELEMENTOS DEL DOM ---
    const totalMessagesEl = document.getElementById('total-messages');
    const uniqueUsersEl = document.getElementById('unique-users');
    const avgResponseTimeEl = document.getElementById('avg-response-time');
    const userIntentsListEl = document.getElementById('user-intents-list');
    const chartCanvas = document.getElementById('top-intents-chart');

    // --- FUNCIÓN PARA OBTENER Y MOSTRAR MÉTRICAS ---
    const fetchAndDisplayMetrics = async () => {
        try {
            const response = await fetch(`${API_URL}/metrics`);
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.statusText}`);
            }
            const data = await response.json();

            // Rellenar KPIs
            totalMessagesEl.textContent = data.total_messages;
            uniqueUsersEl.textContent = data.unique_users;
            avgResponseTimeEl.textContent = `${data.average_response_time_ms} ms`;

            // Rellenar lista de últimas intenciones
            userIntentsListEl.innerHTML = ''; // Limpiar lista
            data.user_last_intents.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>Cédula ${item.user_cedula}:</span> ${item.intent_summary}`;
                userIntentsListEl.appendChild(li);
            });

            // Crear gráfico
            const chartLabels = Object.keys(data.top_intents);
            const chartData = Object.values(data.top_intents);

            new Chart(chartCanvas, {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Número de Consultas',
                        data: chartData,
                        backgroundColor: 'rgba(11, 110, 253, 0.7)',
                        borderColor: 'rgba(11, 110, 253, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y', // Gráfico de barras horizontales para mejor lectura
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

        } catch (error) {
            console.error('Error al obtener las métricas:', error);
            document.getElementById('metrics-container').innerHTML = '<p style="text-align:center; color:red;">No se pudieron cargar las métricas.</p>';
        }
    };

    // --- EJECUCIÓN INICIAL ---
    fetchAndDisplayMetrics();
});