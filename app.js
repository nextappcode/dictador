let recognition;
let isRecording = false;
let lastTranscript = '';

function inicializarReconocimiento() {
    if (recognition) {
        recognition.stop();
    }
    
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;
    
    let textoFinal = document.getElementById('texto').value;
    let transcripcionTemporal = '';
    
    recognition.onresult = (event) => {
        const textarea = document.getElementById('texto');
        textarea.classList.add('procesando');
        transcripcionTemporal = '';
        
        // Obtener solo el último resultado
        const resultado = event.results[event.results.length - 1];
        const transcripcion = resultado[0].transcript;
        
        if (resultado.isFinal) {
            // Evitar duplicados
            if (transcripcion !== lastTranscript) {
                textoFinal = textoFinal ? textoFinal + ' ' + transcripcion : transcripcion;
                textarea.value = corregirPuntuacion(textoFinal);
                lastTranscript = transcripcion;
            }
            recognition.stop();
            textarea.classList.remove('procesando');
        } else {
            // Mostrar texto provisional sin afectar el texto final
            transcripcionTemporal = transcripcion;
            textarea.value = corregirPuntuacion(textoFinal + (textoFinal ? ' ' : '') + transcripcionTemporal);
        }
    };

    recognition.onend = () => {
        if (isRecording && !document.hidden) {
            setTimeout(() => {
                recognition.start();
            }, 250); // Aumentar el tiempo de espera entre reconocimientos
        }
    };

    recognition.onerror = (event) => {
        console.error('Error en el reconocimiento:', event.error);
        document.getElementById('estadoDictado').textContent = 'Error: ' + event.error;
        
        if (isRecording && !document.hidden) {
            setTimeout(() => {
                inicializarReconocimiento();
                recognition.start();
            }, 1000);
        }
    };
}

// Función para corregir puntuación simplificada
function corregirPuntuacion(texto) {
    if (!texto) return '';
    
    // Eliminar espacios múltiples y al inicio/final
    texto = texto.replace(/\s+/g, ' ').trim();
    
    // Comandos de puntuación básicos
    const comandos = {
        'punto': '.',
        'coma': ',',
        'punto y seguido': '.',
        'punto y aparte': '.\n\n',
        'nueva línea': '\n',
        'interrogación': '?',
        'exclamación': '!'
    };

    // Aplicar comandos de puntuación
    Object.entries(comandos).forEach(([comando, signo]) => {
        const regex = new RegExp(`\\b${comando}\\b`, 'gi');
        texto = texto.replace(regex, signo);
    });

    return texto;
}

// Iniciar dictado
document.getElementById('iniciarDictado').addEventListener('click', () => {
    if (!isRecording) {
        buffer = document.getElementById('texto').value;
        inicializarReconocimiento();
        recognition.start();
        isRecording = true;
        document.getElementById('estadoDictado').textContent = 'Estado: Grabando';
        document.getElementById('texto').classList.add('grabando');
        document.getElementById('estadoDictado').classList.add('grabando');
    }
});

// Pausar dictado
document.getElementById('pausarDictado').addEventListener('click', () => {
    if (isRecording) {
        recognition.stop();
        isRecording = false;
        document.getElementById('estadoDictado').textContent = 'Estado: Pausado';
        document.getElementById('texto').classList.remove('grabando');
        document.getElementById('estadoDictado').classList.remove('grabando');
    }
});

// Mantener la grabación activa cuando se cambia de ventana
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRecording) {
        // Guardar el estado antes de pausar
        recognition.stop();
        document.getElementById('estadoDictado').textContent = 'Estado: Pausado (Ventana inactiva)';
    } else if (!document.hidden && isRecording) {
        // Reiniciar el reconocimiento cuando la ventana vuelve a estar activa
        inicializarReconocimiento();
        recognition.start();
        document.getElementById('estadoDictado').textContent = 'Estado: Grabando';
    }
});

// Función para guardar como DOCX
document.getElementById('guardar').addEventListener('click', async () => {
    const texto = document.getElementById('texto').value;
    
    try {
        // Crear documento DOCX usando el namespace correcto
        const doc = new window.docx.Document({
            sections: [{
                properties: {},
                children: [
                    new window.docx.Paragraph({
                        children: [
                            new window.docx.TextRun(texto)
                        ],
                    }),
                ],
            }],
        });

        // Generar y descargar el archivo
        const blob = await window.docx.Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notas_' + new Date().toISOString().slice(0,10) + '.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error al guardar el documento:', error);
        alert('Hubo un error al guardar el documento. Por favor, intente nuevamente.');
    }
});

// Añadir después de los otros event listeners
document.getElementById('limpiar').addEventListener('click', () => {
    document.getElementById('texto').value = '';
    buffer = '';
});
 