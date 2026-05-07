exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key de Groq no configurada" }),
    };
  }

  try {
    const body = JSON.parse(event.body);

    // Convertir formato Anthropic → Groq
    const messages = [];

    // El system prompt va como primer mensaje en Groq
    if (body.system) {
      messages.push({ role: "system", content: body.system });
    }

    // Añadir el historial de conversación
    for (const msg of body.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: messages,
      }),
    });

    const data = await response.json();

    // Convertir respuesta Groq → formato Anthropic que espera el frontend
    const reply = data.choices?.[0]?.message?.content || "Sin respuesta";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        content: [{ type: "text", text: reply }],
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
