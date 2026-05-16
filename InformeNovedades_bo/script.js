const URL_API_EXCEL = "https://script.google.com/macros/s/AKfycbwcLbLrSY2vp6P03iTW6O4p2zDLzRESxqiY3qKh86r433vgnlivuOrKCgv-sTh7ImFqug/exec";

const grid = document.getElementById('novedadesGrid');

let datosExcel = []; // Aquí se guardarán los datos que vienen de Google

// 1. Función para obtener los datos de Google Sheets
async function obtenerDatos() {
    try {
        grid.innerHTML = '<p style="text-align:center; width:100%;">Cargando novedades...</p>';
        const respuesta = await fetch(URL_API_EXCEL);
        datosExcel = await respuesta.json();
        
        if (datosExcel.error) {
            grid.innerHTML = `<p>Error: ${datosExcel.error}</p>`;
        } else {
            renderCards(datosExcel);
        }
    } catch (error) {
        grid.innerHTML = '<p>Error al conectar.</p>';
        console.error("Error detallado:", error);
    }
}

// 2. Función para crear las tarjetas en el HTML
function renderCards(novedades) {
    grid.innerHTML = ''; 
    
    novedades.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const getData = (key) => {
            const foundKey = Object.keys(item).find(k => k.toLowerCase().trim() === key.toLowerCase());
            return foundKey ? item[foundKey] : null;
        };

        const estadoKey = Object.keys(item).find(k => k.toLowerCase().trim() === 'estado');
        const estado = estadoKey ? item[estadoKey] : '';
        const completadoChecked = estado && estado.toString().toLowerCase().trim() === 'completado';

        if (completadoChecked) {
            card.hidden = true;
            card.classList.add('hidden-card');
        }

        // --- FORMATEO DE FECHA ---
        let fechaMostrar = "";
        let fechaRaw = getData('Fecha') || getData('Fecha informe');
        
        if (fechaRaw) {
            // 1. Extraemos solo la parte de la fecha (YYYY-MM-DD)
            const fechaSolo = fechaRaw.toString().includes('T') ? fechaRaw.split('T')[0] : fechaRaw;
    
            // 2. REORDENAMOS: de YYYY-MM-DD a DD-MM-YYYY
            fechaMostrar = fechaSolo.split('-').reverse().join('-');
        }

        // --- FORMATEO DE HORARIO ---
        let horarioMostrar = "";
        let horarioRaw = getData('Horario');

        if (horarioRaw) {
            // Si viene el error de 1899, extraemos solo la hora
            if (horarioRaw.toString().includes('T')) {
                // Extrae "10:00" de "1899-12-30T10:00:00.000Z"
                horarioMostrar = horarioRaw.split('T')[1].substring(0, 5);
            } else {
                horarioMostrar = horarioRaw;
            }
        }

        const docente = getData('Docente') || 'Sin nombre';
        const asignatura = getData('Asignatura') || 'N/A';
        const laboratorio = getData('Laboratorio') || 'S/N';
        const tipo = getData('PROBLEMAS DETECTADOS') || 'General';
        const detalle = getData('DESCRIPCION GENERAL') || 'Sin detalle';

        card.innerHTML = `
            <div class="form-check completed-check">
                <input class="form-check-input" type="checkbox" id="completado-${index}" ${completadoChecked ? 'checked' : ''}>
                <label class="form-check-label" for="completado-${index}">Completado</label>
            </div>
            <div class="badge">Reporte Informe Novedades</div><br>
            <div class="badge">${laboratorio}</div>
            <h3>${docente}</h3>
            <p><span class="label">Asignatura:</span> ${asignatura}</p>
            <p><span class="label">Problema Detectado:</span> ${tipo}</p>
            <p><span class="label">Detalle:</span> ${detalle}</p>
            <p style="font-size: 0.85rem; color: #555; text-align: right; margin-top:15px; font-weight: bold;">
                📅 ${fechaMostrar} &nbsp; 🕒 ${horarioMostrar} hrs
            </p>
        `;

        const checkbox = card.querySelector(`#completado-${index}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    if (estadoKey) {
                        item[estadoKey] = 'Completado';
                    } else {
                        item.Estado = 'Completado';
                    }
                    card.hidden = true;
                    card.classList.add('hidden-card');
                }
            });
        }

        grid.appendChild(card);
    });
}


//  Ejecutar la carga al abrir la página
obtenerDatos();