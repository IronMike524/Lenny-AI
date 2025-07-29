document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    // !!! RECUERDA CAMBIAR ESTA URL POR LA DE TU BACKEND EN RENDER !!!
    const API_URL = 'https://lenny-ai-a9dx.onrender.com'; // URL de ejemplo

    // --- ELEMENTOS DEL DOM ---
    const totalMessagesEl = document.getElementById('total-messages');
    const uniqueUsersEl = document.getElementById('unique-users');
    const avgResponseTimeEl = document.getElementById('avg-response-time');
    const userIntentsTbodyEl = document.getElementById('user-intents-tbody');
    const chartCanvas = document.getElementById('top-intents-chart');
    const metricsContainer = document.getElementById('metrics-container');

    let topIntentsChart = null; // Variable para almacenar la instancia del gráfico

    // --- FUNCIÓN PARA OBTENER Y MOSTRAR MÉTRICAS REALES ---
    const fetchAndDisplayMetrics = async () => {
        try {
            const response = await fetch(`${API_URL}/metrics`);
            if (!response.ok) {
                // Si el servidor responde con un error (ej. 404 si no hay datos)
                const errorData = await response.json();
                throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
            }
            const data = await response.json();

            // 1. Rellenar los KPIs
            totalMessagesEl.textContent = data.total_messages;
            uniqueUsersEl.textContent = data.unique_users;
            avgResponseTimeEl.textContent = `${data.average_response_time_ms} ms`;

            // 2. Rellenar la tabla de últimas intenciones por usuario
            userIntentsTbodyEl.innerHTML = ''; // Limpiar la tabla antes de rellenar
            if (data.user_last_intents && data.user_last_intents.length > 0) {
                data.user_last_intents.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.user_cedula}</td>
                        <td>${item.intent_summary}</td>
                    `;
                    userIntentsTbodyEl.appendChild(row);
                });
            } else {
                 const row = document.createElement('tr');
                 row.innerHTML = `<td colspan="2">No hay datos de intenciones de usuario.</td>`;
                 userIntentsTbodyEl.appendChild(row);
            }


            // 3. Crear o actualizar el gráfico de Top 5 Temas
            if (chartCanvas) {
                const chartLabels = Object.keys(data.top_intents);
                const chartData = Object.values(data.top_intents);

                // Destruir el gráfico anterior si existe para evitar duplicados
                if (topIntentsChart) {
                    topIntentsChart.destroy();
                }

                topIntentsChart = new Chart(chartCanvas, {
                    type: 'bar', // Gráfico de barras es mejor para rankings
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            label: 'Número de Consultas',
                            data: chartData,
                            backgroundColor: [
                                'rgba(11, 110, 253, 0.7)',
                                'rgba(40, 167, 69, 0.7)',
                                'rgba(255, 193, 7, 0.7)',
                                'rgba(220, 53, 69, 0.7)',
                                'rgba(111, 66, 193, 0.7)'
                            ],
                            borderColor: [
                                'rgba(11, 110, 253, 1)',
                                'rgba(40, 167, 69, 1)',
                                'rgba(255, 193, 7, 1)',
                                'rgba(220, 53, 69, 1)',
                                'rgba(111, 66, 193, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        indexAxis: 'y', // Hace el gráfico horizontal para mejor legibilidad
                        scales: {
                            x: {
                                beginAtZero: true
                            }
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false // La leyenda es redundante en este caso
                            }
                        }
                    }
                });
            }

        } catch (error) {
            console.error('Error al obtener las métricas:', error);
            metricsContainer.innerHTML = `<p class="error-message">No se pudieron cargar las métricas: ${error.message}</p>`;
        }
    };

    // --- EJECUCIÓN INICIAL ---
    fetchAndDisplayMetrics();
});