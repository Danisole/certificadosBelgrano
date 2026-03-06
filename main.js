let listaProfesores = []; // Variable global para guardar los datos del JSON

$(document).ready(function() {
    $('#selectProfesores').select2({
        placeholder: "Busca y selecciona profesores...",
        allowClear: true
    });

    const ahora = new Date();

    const fechaLocal = ahora.toLocaleDateString('sv-SE'); 
    // formato YYYY-MM-DD

    document.getElementById('fechaEmision').value = fechaLocal;
    document.getElementById('fechaJornada').value = fechaLocal;

    document.getElementById('hora').value =
    ahora.getHours().toString().padStart(2, '0') + ":" +
    ahora.getMinutes().toString().padStart(2, '0');
    
    cargarProfesoresDesdeJSON();

    // LÓGICA DE MODO OSCURO
    const switchDark = document.getElementById('darkModeSwitch');
    
    switchDark.addEventListener('change', () => {
        if (switchDark.checked) {
            // Aplicamos el atributo de Bootstrap 5.3
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('theme', 'dark'); // Guardar preferencia
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    // Cargar preferencia guardada al abrir la página
    if (localStorage.getItem('theme') === 'dark') {
        switchDark.checked = true;
        document.documentElement.setAttribute('data-bs-theme', 'dark');
    }
});

function cargarProfesoresDesdeJSON() {
    fetch('profesores.json')
        .then(response => response.json())
        .then(data => {
            listaProfesores = data; // Guardamos la lista completa
            const select = $('#selectProfesores');
            
            // Ordenar alfabéticamente
            data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            
            data.forEach(p => {
                // Usamos el ID como value para buscarlo después fácilmente
                const option = new Option(p.nombre, p.id, false, false);
                select.append(option);
            });
            select.trigger('change');
        })
        .catch(err => console.error("Error:", err));
}

function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4'); 
    
    // Captura segura de datos (si el ID no existe, devuelve vacío en vez de romper todo)
    const idsSeleccionados = $('#selectProfesores').val();
    const motivoRaw = document.getElementById('motivo')?.value || "Jornada Institucional";
    const motivo = capitalizarPrimeraLetra(motivoRaw);
    
    const fJornada = document.getElementById('fechaJornada')?.value || "";
    const hJornada = document.getElementById('horaJornadaManual')?.value || ""; // <--- Captura protegida
    
    const fEmision = document.getElementById('fechaEmision')?.value || "";
    const hora = document.getElementById('hora')?.value || "";

    if (!idsSeleccionados || idsSeleccionados.length === 0) {
        alert("Selecciona al menos un profesor");
        return;
    }

    let contadorEnHoja = 0;

    idsSeleccionados.forEach((id, index) => {
        const profeData = listaProfesores.find(p => p.id == id);
        if (!profeData) return; // Saltear si no encuentra al profe

        const yBase = (contadorEnHoja === 0) ? 10 : 150;

        // --- DIBUJO DEL MARCO ---
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(10, yBase, 190, 135); 

        // --- LOGO ---
        try {
            const xLogo = 210 - 18 - 45; 
            doc.addImage(LOGO_BASE64, 'PNG', xLogo, yBase + 10, 45, 10);
        } catch (e) { console.error("Logo no encontrado"); }

        // --- MEMBRETE ---
        doc.setFontSize(8).setFont(undefined, 'bold');
        doc.text("MINISTERIO DE EDUCACIÓN", 15, yBase + 12);
        doc.setFontSize(7).setFont(undefined, 'normal');
        doc.text("SECRETARIA DE GESTIÓN", 15, yBase + 16);
        doc.text("DIRECCIÓN DE EDUCACIÓN SECUNDARIA, ORIENTADA Y ARTISTICA", 15, yBase + 19);
        doc.text("ESCUELA DE COMERCIO GRAL. MANUEL BELGRANO", 15, yBase + 22);

        // --- TÍTULOS ---
        doc.setFontSize(18).setFont(undefined, 'bold');
        doc.text("CERTIFICADO DE ASISTENCIA", 105, yBase + 35, { align: "center" });
        
        doc.setFontSize(12).setFont(undefined, 'normal');
        doc.text("La Dirección de la Escuela de Comercio Gral. Manuel Belgrano", 105, yBase + 55, { align: "center" });
        doc.text("Certifica que el Prof./a:", 105, yBase + 65, { align: "center" });

        doc.setFontSize(15).setFont(undefined, 'bold');
        doc.text(profeData.nombre.toUpperCase(), 105, yBase + 75, { align: "center" });

        doc.setFontSize(13).setFont(undefined, 'normal');
        doc.text(`D.N.I. Nº: ${profeData.dni}`, 105, yBase + 83, { align: "center" });

        // --- DETALLES DINÁMICOS ---
        const textoMotivo = doc.splitTextToSize(`Asistió a: ${motivo}`, 170);
        doc.text(textoMotivo, 105, yBase + 95, { align: "center" });

        // Formatear fecha para el PDF (DD/MM/AAAA)
        const fechaLinda = fJornada.split('-').reverse().join('/');
        let lineaInfo = `Realizada el día: ${fechaLinda}`;
        if (hJornada) lineaInfo += ` en el horario de ${hJornada}`;
        
        doc.text(lineaInfo, 105, yBase + 108, { align: "center" });
        
        // PIE DE PÁGINA
        doc.setFontSize(9);
        doc.text(`Emitido el: ${fEmision.split('-').reverse().join('/')} a las ${hora} hs.`, 30, yBase + 130);
        doc.line(130, yBase + 125, 180, yBase + 125);
        doc.text("Firma Dirección", 155, yBase + 129, { align: "center" });

        contadorEnHoja++;
        if (contadorEnHoja === 2 && index < idsSeleccionados.length - 1) {
            doc.addPage();
            contadorEnHoja = 0;
        }
    });

    const blob = doc.output('bloburl');
    window.open(blob, '_blank');
}



function capitalizarPrimeraLetra(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}
