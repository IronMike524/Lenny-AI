# Lenny AI 🤖

Asistente virtual inteligente para una Hackaton desarrollado con Python Flask + Google Gemini AI. 


## Stack Tecnológico

**Backend:**
- Python 3.12 + Flask
- Google Gemini AI (models/gemini-1.5-flash)
- Supabase (PostgreSQL)
- scikit-learn para búsqueda semántica
- pandas para procesamiento de datos

**Frontend:**
- Vanilla JavaScript (no frameworks, mantenerlo simple)
- Chart.js para visualización de métricas
- CSS moderno con variables y grid
- Diseño responsive mobile-first

## Configuración Rápida

### 1. Clonar y preparar entorno

```bash
git clone https://github.com/IronMike524/Lenny-AI.git
cd Lenny-AI/backend
pip install -r requirements.txt
```

### 2. Variables de entorno (.env)

Crear archivo `.env` en la carpeta `backend/`:

```env
GEMINI_API_KEY=tu_api_key_de_google_ai_studio
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_anon_key_de_supabase
```

**Obtener las APIs:**
- **Gemini**: Ve a [Google AI Studio](https://aistudio.google.com/) y crea una API key gratuita
- **Supabase**: Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito incluye 500MB)

### 3. Configurar base de datos

En tu dashboard de Supabase, ejecuta estas consultas SQL:

```sql
-- Tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_cedula VARCHAR(20) REFERENCES users(cedula),
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    intent_summary VARCHAR(200),
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Ejecutar aplicación

```bash
# Backend
cd backend
python app.py

# Frontend (nueva terminal)
cd frontend
python -m http.server 8080
```

Navega a `http://localhost:8080` para usar la aplicación.

## Arquitectura del Proyecto

```
├── backend/
│   ├── app.py                 # API Flask principal
│   ├── knowledge_base.json    # FAQs de INGELEAN (editable)
│   ├── requirements.txt       # Dependencias Python
│   └── .env                   # Credenciales (git-ignored)
│
├── frontend/
│   ├── index.html            # Chat interface
│   ├── metrics.html          # Dashboard de métricas
│   ├── css/style.css         # Estilos únicos
│   └── js/
│       ├── app.js            # Lógica del chat
│       └── metrics.js        # Lógica del dashboard
```

## Características Técnicas

### Sistema Híbrido de IA
- **Búsqueda semántica**: TF-IDF para encontrar FAQs relevantes
- **Generación**: Google Gemini para respuestas contextuales
- **Memoria conversacional**: Historial almacenado en Supabase

### Dashboard de Métricas
- KPIs en tiempo real (conversaciones, usuarios únicos, tiempo de respuesta)
- Gráficos interactivos con Chart.js
- Análisis de intenciones y patrones de uso
- Exportación de datos para análisis adicional

### Performance
- Respuestas típicas en ~280ms
- Búsqueda vectorial optimizada con scikit-learn
- Base de datos indexada para consultas rápidas
- Frontend sin frameworks para carga instantánea

## Personalización

### Agregar nuevos FAQs
Edita `backend/knowledge_base.json`:

```json
{
  "faqs": [
    {
      "question": "¿Nueva pregunta?",
      "answer": "Nueva respuesta con información específica de INGELEAN"
    }
  ]
}
```

### Modificar comportamiento del bot
En `app.py`, ajusta el prompt del sistema:

```python
prompt = f"""
Eres "Lenny AI", asistente de INGELEAN S.A.S...
[Personaliza las instrucciones aquí]
"""
```

## Deployment

### Opción 1: Render (Recomendado)
- Fork este repo
- Conecta con Render
- Agrega las variables de entorno
- Deploy automático desde main branch

### Opción 2: VPS/Cloud
```bash
# Con gunicorn para producción
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Métricas y Monitoreo

El dashboard incluye:
- **Actividad por hora**: Patrones de uso diario
- **Top intenciones**: Temas más consultados
- **Usuarios activos**: Engagement y frecuencia
- **Tiempos de respuesta**: Performance del sistema
- **Calidad de servicio**: Métricas de satisfacción

Útil para optimizar la base de conocimiento y identificar áreas de mejora.

## Limitaciones Conocidas

- **Gemini API**: 15 RPM en plan gratuito (suficiente para demos)
- **Supabase**: 500MB storage en plan gratuito
- **Contexto**: Limitado a FAQs predefinidas (por diseño)
- **Autenticación**: Básica por cédula (mejorar para producción)

## Roadmap

- [ ] Integración con WhatsApp Business API
- [ ] Sistema de ratings para respuestas
- [ ] Analytics avanzados con Google Analytics
- [ ] Soporte multiidioma
- [ ] API REST documentada con Swagger

## Contribuir

1. Fork del repo
2. Crea feature branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agrega nueva funcionalidad'`
4. Push a branch: `git push origin feature/nueva-funcionalidad`
5. Abre Pull Request

