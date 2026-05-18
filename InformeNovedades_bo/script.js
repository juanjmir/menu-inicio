//lee data
const URL_API_EXCEL = "https://script.google.com/macros/s/AKfycbyYA8txjE7PyfVpwLL2AY36uIocrF36CDmYx1BbNkKci4GcnH4FaB2c38m3oxa0v1Uy/exec";

//modifica estado
const URL_API_ACTUALIZAR = "https://script.google.com/macros/s/AKfycbw0tYs3HVeNurnKRpLwbamNAAlLxH5urwNnmmv_5Xadm8zIVLvx-tN0XDMGc4_X974W/exec"; 

const grid = document.getElementById('novedadesGrid');
let datosExcel = []; 

// --- CREACIÓN DEL DIALOG (MODAL NATIVO) ---
// Borramos cualquier intento previo si existía
const modalViejo = document.getElementById('modalRolDialog');
if(modalViejo) modalViejo.remove();

const dialog = document.createElement('dialog');
dialog.id = 'modalRolDialog';
dialog.style.padding = '20px';
dialog.style.borderRadius = '8px';
dialog.style.border = '1px solid #ccc';
dialog.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
dialog.style.width = '300px';
dialog.style.textAlign = 'center';

dialog.innerHTML = `
    <h3 style="margin-top:0;">Finalizar Novedad</h3>
    <p>Selecciona tu Rol para firmar:</p>
    <select id="selectRol" style="width: 100%; padding: 8px; margin-bottom: 15px;">
        <option value="DC">DC</option>
        <option value="CC AUTOMATIZACION">CC AUTOMATIZACION</option>
        <option value="CC INFORMATICA">CC INFORMATICA</option>
        <option value="PAÑOL AUTOMATIZACION">PAÑOL AUTOMATIZACION</option>
        <option value="PAÑOL INFORMATICA">PAÑOL INFORMATICA</option>
    </select>
    <div style="display: flex; justify-content: space-around;">
        <button id="btnConfirmarRol" style="background:#28a745; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Confirmar</button>
        <button id="btnCancelarRol" style="background:#dc3545; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Cancelar</button>
    </div>
`;
document.body.appendChild(dialog);

// Variables globales de control para el registro activo
let checkboxActual = null;
let cardActual = null;
let itemActual = null;

// Evento Cancelar Modal
document.getElementById('btnCancelarRol').addEventListener('click', () => {
    if (checkboxActual) checkboxActual.checked = false; // Desmarca el checkbox si cancela
    dialog.close();
});

// Evento Confirmar Modal -> Aquí es donde se envía al Excel y se oculta la card
document.getElementById('btnConfirmarRol').addEventListener('click', async () => {
    const rolSeleccionado = document.getElementById('selectRol').value;
    dialog.close();

    if (itemActual) {
        // Buscamos la llave 'folio' sin importar mayúsculas/minúsculas
        const foundKeyFolio = Object.keys(itemActual).find(k => k.toLowerCase().trim() === 'folio');
        const folioId = foundKeyFolio ? itemActual[foundKeyFolio] : null;

        if (!folioId) {
            alert("Error: Este registro no posee un 'Folio' visible.");
            if (checkboxActual) checkboxActual.checked = false;
            return;
        }

        // 1. RECIÉN AQUÍ ocultamos la tarjeta de la pantalla
        if (cardActual) {
            cardActual.hidden = true;
            cardActual.classList.add('hidden-card');
        }

        // 2. Enviamos los datos al nuevo Apps Script
        try {
            console.log("Enviando actualización para Folio:", folioId, "Rol:", rolSeleccionado);
            
            await fetch(URL_API_ACTUALIZAR, {
                method: 'POST',
                mode: 'no-cors', // Necesario para evitar bloqueos de CORS con Google Apps Script
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folio: folioId,
                    encargado: rolSeleccionado
                })
            });
            
            console.log("Petición enviada al servidor con éxito.");
        } catch (error) {
            console.error("Error en la conexión con la API de actualización:", error);
        }
    }
});

// Función para obtener los datos de Google Sheets
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

// Función para renderizar las tarjetas
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
        
        // Ocultar si ya está completado o terminado en la base de datos
        const completadoChecked = estado && (estado.toString().toLowerCase().trim() === 'completado' || estado.toString().toLowerCase().trim() === 'terminado');

        if (completadoChecked) {
            card.hidden = true;
            card.classList.add('hidden-card');
        }

        let fechaMostrar = "";
        let fechaRaw = getData('Fecha') || getData('Fecha informe');
        if (fechaRaw) {
            const fechaSolo = fechaRaw.toString().includes('T') ? fechaRaw.split('T')[0] : fechaRaw;
            fechaMostrar = fechaSolo.split('-').reverse().join('-');
        }

   
        let horarioMostrar = "N/A";
        let horarioRaw = getData('Horario');
        if (horarioRaw) {
            let strHorario = horarioRaw.toString().trim();
            
            // Si viene con el formato ISO de Google (ej: 1899-12-30T10:55:00)
            if (strHorario.includes('T')) {
                // Corta después de la 'T' y toma los primeros 5 caracteres de la hora
                horarioMostrar = strHorario.split('T')[1].substring(0, 5);
            } else {
                // Si ya venía limpio del Excel ("10:55"), toma los primeros 5 caracteres
                horarioMostrar = strHorario.substring(0, 5);
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
            <div class="label"><center>Reporte Informe Novedades</center></div>
            <h4>${docente}</h4>
            <div class="badge">${laboratorio}</div>
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
                    // Guardamos las referencias de la tarjeta clickeada
                    checkboxActual = checkbox;
                    cardActual = card;
                    itemActual = item;
                    
                    // Abrimos el modal nativo en pantalla
                    dialog.showModal();
                }
            });
        }

        grid.appendChild(card);
    });
}

obtenerDatos();