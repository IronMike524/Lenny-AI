import os
import time
import json
import pandas as pd
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from supabase import create_client, Client
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask_cors import CORS

# --- 1. CONFIGURACIÓN INICIAL ---

# Cargar variables de entorno
load_dotenv()

# Configurar API de Gemini
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("No se encontró la GEMINI_API_KEY en el archivo .env")
genai.configure(api_key=gemini_api_key)

# Configurar cliente de Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    raise ValueError("No se encontraron las credenciales de Supabase en el archivo .env")
supabase: Client = create_client(supabase_url, supabase_key)

# Cargar y procesar la base de conocimiento
with open('knowledge_base.json', 'r', encoding='utf-8') as f:
    knowledge_base = json.load(f)

faqs_df = pd.DataFrame(knowledge_base['faqs'])
faqs_df['texto_completo'] = (faqs_df['question'] + " " + faqs_df['answer']).str.lower()

# Vectorizador TF-IDF
vectorizer = TfidfVectorizer()
tfidf_matrix = vectorizer.fit_transform(faqs_df['texto_completo'])

# Modelo de IA Generativa
model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")

# Inicializar Flask y habilitar CORS
app = Flask(__name__)
CORS(app) # Permite que el frontend en GitHub Pages llame a esta API

# --- 2. FUNCIONES AUXILIARES ---

def buscar_contexto(pregunta: str) -> str:
    """Busca las 3 FAQs más relevantes a la pregunta."""
    pregunta_vec = vectorizer.transform([pregunta.lower()])
    similitudes = cosine_similarity(pregunta_vec, tfidf_matrix).flatten()
    
    # Obtener los 3 mejores índices, solo si su similitud es razonable (> 0.1)
    top_indices = [i for i in similitudes.argsort()[::-1][:3] if similitudes[i] > 0.1]
    
    if not top_indices:
        return "No se encontró información relevante en la base de conocimiento."
        
    mejores = faqs_df.iloc[top_indices]
    
    # Formatear el contexto para el prompt
    contexto = "\n\n".join([f"Pregunta Frecuente: {row['question']}\nRespuesta: {row['answer']}" for _, row in mejores.iterrows()])
    return contexto

# --- 3. RUTAS DE LA API ---

@app.route('/login', methods=['POST'])
def login():
    """Registra un nuevo usuario o verifica uno existente."""
    data = request.json
    cedula = data.get('cedula')
    nombre = data.get('nombre')

    if not cedula or not nombre:
        return jsonify({"error": "Cédula y nombre son requeridos"}), 400

    try:
        # Verificar si el usuario ya existe
        response = supabase.table('users').select('cedula, nombre').eq('cedula', cedula).execute()
        
        if response.data:
            # El usuario existe, devolvemos su nombre guardado
            user_data = response.data[0]
            return jsonify({"message": f"¡Hola de nuevo, {user_data['nombre']}!", "user": user_data}), 200
        else:
            # El usuario no existe, lo creamos
            user_data = {'cedula': cedula, 'nombre': nombre}
            response = supabase.table('users').insert(user_data).execute()
            if response.data:
                 return jsonify({"message": f"¡Bienvenido, {nombre}!", "user": response.data[0]}), 201
            else:
                return jsonify({"error": "No se pudo registrar el usuario"}), 500
    except Exception as e:
        return jsonify({"error": f"Error en la base de datos: {str(e)}"}), 500


@app.route('/chat', methods=['POST'])
def chat():
    """Procesa un mensaje del chat, lo guarda y devuelve una respuesta."""
    start_time = time.time()
    
    data = request.json
    user_cedula = data.get('cedula')
    user_input = data.get('message', '').strip()

    if not user_cedula or not user_input:
        return jsonify({"error": "Cédula y mensaje son requeridos"}), 400

    # 1. Buscar contexto relevante en las FAQs
    contexto = buscar_contexto(user_input)
    
    # 2. Obtener historial de conversación de Supabase (últimos 4 turnos)
    historial_res = supabase.table('messages').select('user_message, bot_response').eq('user_cedula', user_cedula).order('created_at', desc=True).limit(4).execute()
    historial = ""
    if historial_res.data:
        for turno in reversed(historial_res.data): # Invertir para orden cronológico
            historial += f"Usuario: {turno['user_message']}\nLenny AI: {turno['bot_response']}\n"

    # 3. Construir el prompt para Gemini
    prompt = f"""
Eres "Lenny AI", un asistente virtual experto de INGELEAN S.A.S. Tu tono debe ser profesional, amable y servicial.

**Contexto de la empresa (FAQs):**
{contexto}

**Historial de la conversación reciente:**
{historial}

**Última pregunta del usuario:** {user_input}

**Instrucciones:**
1. Responde a la última pregunta del usuario basándote **únicamente** en el contexto y el historial proporcionados.
2. Si la información no es suficiente, pide amablemente más detalles. No inventes información sobre INGELEAN.
3. Si el usuario pregunta por algo no relacionado, cortésmente redirige la conversación a los servicios de INGELEAN.
4. Mantén las respuestas claras y concisas.
"""
    
    # 4. Generar respuesta del bot
    bot_response = model.generate_content(prompt).text.strip()
    
    # 5. Generar resumen de la intención del usuario
    resumen_prompt = f"En una frase corta (máximo 10 palabras), resume la necesidad principal del usuario basándote en su mensaje: \"{user_input}\""
    intent_summary = model.generate_content(resumen_prompt).text.strip().replace("\n", " ")

    end_time = time.time()
    response_time_ms = int((end_time - start_time) * 1000)

    # 6. Guardar la interacción completa en Supabase
    try:
        supabase.table('messages').insert({
            'user_cedula': user_cedula,
            'user_message': user_input,
            'bot_response': bot_response,
            'intent_summary': intent_summary,
            'response_time_ms': response_time_ms
        }).execute()
    except Exception as e:
        print(f"Error al guardar en BBDD: {e}") # Log del error en el servidor

    return jsonify({"response": bot_response})

@app.route('/metrics', methods=['GET'])
def metrics():
    """Devuelve las métricas de uso del chatbot."""
    try:
        # Obtener todos los mensajes
        messages_res = supabase.table('messages').select('intent_summary, response_time_ms, user_cedula').execute()
        if not messages_res.data:
            return jsonify({"error": "No hay datos para mostrar"}), 404
        
        df = pd.DataFrame(messages_res.data)

        # 1. Preguntas más frecuentes (agrupando resúmenes de intención)
        frequent_intents = df['intent_summary'].value_counts().nlargest(5).to_dict()

        # 2. Tiempo promedio de respuesta
        avg_response_time = df['response_time_ms'].mean()

        # 3. Número total de conversaciones (usuarios únicos)
        total_conversations = df['user_cedula'].nunique()
        
        # 4. Resúmenes por usuario (último resumen de cada uno)
        user_summaries = df.loc[df.groupby('user_cedula')['intent_summary'].idxmax()][['user_cedula', 'intent_summary']].to_dict('records')

        return jsonify({
            "total_messages": len(df),
            "average_response_time_ms": int(avg_response_time),
            "unique_users": total_conversations,
            "top_intents": frequent_intents,
            "user_last_intents": user_summaries
        })

    except Exception as e:
        return jsonify({"error": f"Error al calcular métricas: {str(e)}"}), 500


if __name__ == '__main__':
    # Usar el puerto que Render asigne, con un default de 5000 para pruebas locales
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)