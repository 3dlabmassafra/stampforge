// Anello Parametrico "Festa della Mamma" per MakerWorld
// Creazione di un classico anello chevalier (signet ring) con incisione personalizzabile e multi-colore.

/* [Dimensioni Anello] */
// Diametro interno dell'anello (mm) - Misura del dito (Es: 16.5 è circa misura 12 ITA)
diametro_interno = 17.0; // [12.0:0.1:25.0]

// Spessore della fascia inferiore (mm) - Quanto è spesso l'anello sotto il dito
spessore_fascia = 1.5; // [1.0:0.1:4.0]

// Larghezza della fascia inferiore (mm)
larghezza_fascia = 4.0; // [2.0:0.1:10.0]

/* [Dimensioni Parte Superiore] */
// Larghezza della parte piatta superiore (mm) (Orizzontale)
larghezza_top = 15.0; // [8.0:0.1:30.0]

// Lunghezza della parte piatta superiore (mm) (Verticale, lungo il dito)
lunghezza_top = 13.0; // [8.0:0.1:30.0]

// Spessore della parte superiore dal dito (mm)
spessore_top = 3.0; // [1.0:0.1:10.0]

// Raggio di arrotondamento degli spigoli superiori (mm)
raggio_angoli = 3.0; // [0.0:0.1:10.0]

/* [Personalizzazione Design] */
// Cosa vuoi mostrare sulla parte superiore?
scelta_design = 3; // [1:Solo Testo, 2:Solo Cuore, 3:Testo e Cuore, 4:Stella, 5:Nessuno (Piatto)]

// Testo (Riga 1)
testo_riga1 = "MAMMA"; 

// Testo (Riga 2 - Lascia vuoto per avere una sola riga grande)
testo_riga2 = ""; 

// Dimensione del testo/disegno
dimensione_design = 4.0; // [2.0:0.1:15.0]

// Profondità (o altezza) del disegno (mm)
profondita_design = 0.8; // [0.2:0.1:3.0]

// Stile del design
scelta_stile = 3; // [1:Inciso Semplice (Scavato), 2:In Rilievo (Sporgente), 3:Intarsio Colorato (Liscio e multi-colore AMS)]

// Font del testo
scelta_font = 1; // [1:Arial, 2:Courier New, 3:Times New Roman, 4:Comic Sans MS, 5:Impact, 6:Liberation Sans]

font_testo = (scelta_font == 1) ? "Arial" :
             (scelta_font == 2) ? "Courier New" :
             (scelta_font == 3) ? "Times New Roman" :
             (scelta_font == 4) ? "Comic Sans MS" :
             (scelta_font == 5) ? "Impact" : "Liberation Sans";

/* [Colori (Multi-Materiale)] */
// Colore dell'Anello
scelta_colore_anello = 1; // [1:Oro, 2:Argento, 3:Rosso, 4:Blu, 5:Verde, 6:Nero, 7:Bianco, 8:Rosa]
colore_anello = (scelta_colore_anello == 1) ? "#FFD700" : (scelta_colore_anello == 2) ? "#C0C0C0" : (scelta_colore_anello == 3) ? "#FF0000" : (scelta_colore_anello == 4) ? "#0000FF" : (scelta_colore_anello == 5) ? "#00FF00" : (scelta_colore_anello == 6) ? "#333333" : (scelta_colore_anello == 7) ? "#FFFFFF" : "#FFC0CB";

// Colore del Testo
scelta_colore_testo = 6; // [1:Oro, 2:Argento, 3:Rosso, 4:Blu, 5:Verde, 6:Nero, 7:Bianco, 8:Rosa]
colore_testo = (scelta_colore_testo == 1) ? "#FFD700" : (scelta_colore_testo == 2) ? "#C0C0C0" : (scelta_colore_testo == 3) ? "#FF0000" : (scelta_colore_testo == 4) ? "#0000FF" : (scelta_colore_testo == 5) ? "#00FF00" : (scelta_colore_testo == 6) ? "#333333" : (scelta_colore_testo == 7) ? "#FFFFFF" : "#FFC0CB";

// Colore del Simbolo (Cuore o Stella)
scelta_colore_simbolo = 3; // [1:Oro, 2:Argento, 3:Rosso, 4:Blu, 5:Verde, 6:Nero, 7:Bianco, 8:Rosa]
colore_simbolo = (scelta_colore_simbolo == 1) ? "#FFD700" : (scelta_colore_simbolo == 2) ? "#C0C0C0" : (scelta_colore_simbolo == 3) ? "#FF0000" : (scelta_colore_simbolo == 4) ? "#0000FF" : (scelta_colore_simbolo == 5) ? "#00FF00" : (scelta_colore_simbolo == 6) ? "#333333" : (scelta_colore_simbolo == 7) ? "#FFFFFF" : "#FFC0CB";

/* [Avanzate] */
// Risoluzione (valori più alti = più liscio ma più lento da generare)
risoluzione = 100; // [50:10:200]

// --- Fine dei Parametri ---

$fn = risoluzione;

module signet_ring() {
    difference() {
        union() {
            // Corpo principale dell'anello
            color(colore_anello)
            hull() {
                // Fascia inferiore (cilindro)
                rotate([90, 0, 0])
                    cylinder(h=larghezza_fascia, d=diametro_interno + 2*spessore_fascia, center=true);
                
                // Piatto superiore
                translate([0, 0, diametro_interno/2 + spessore_top - 0.05])
                    linear_extrude(0.1)
                    rounded_square_2d(larghezza_top, lunghezza_top, raggio_angoli);
            }
            
            // Design in rilievo
            if (scelta_stile == 2 && scelta_design != 5) {
                translate([0, 0, diametro_interno/2 + spessore_top - 0.01])
                    draw_3d_design(profondita_design);
            }
        }
        
        // Foro centrale per il dito
        rotate([90, 0, 0])
            cylinder(h=max(larghezza_fascia, lunghezza_top) + 20, d=diametro_interno, center=true);
            
        // Scavo (se Inciso Semplice o Intarsio Colorato)
        if ((scelta_stile == 1 || scelta_stile == 3) && scelta_design != 5) {
            translate([0, 0, diametro_interno/2 + spessore_top - profondita_design + 0.01])
                draw_3d_design(profondita_design + 1);
        }
    }
    
    // Corpo di riempimento colorato (per Intarsio Colorato AMS)
    if (scelta_stile == 3 && scelta_design != 5) {
        translate([0, 0, diametro_interno/2 + spessore_top - profondita_design + 0.02])
            draw_3d_design(profondita_design - 0.02);
    }
}

module rounded_square_2d(w, l, r) {
    r_safe = min(r, w/2, l/2);
    if (r_safe > 0.01) {
        hull() {
            translate([-w/2 + r_safe, -l/2 + r_safe]) circle(r=r_safe);
            translate([w/2 - r_safe, -l/2 + r_safe]) circle(r=r_safe);
            translate([-w/2 + r_safe, l/2 - r_safe]) circle(r=r_safe);
            translate([w/2 - r_safe, l/2 - r_safe]) circle(r=r_safe);
        }
    } else {
        square([w, l], center=true);
    }
}

// Ridimensiona il testo in automatico se è troppo lungo per l'anello
module smart_text(txt, size, max_w) {
    // Stima della larghezza del testo
    approx_w = len(txt) * size * 0.75;
    scale_factor = (approx_w > max_w) ? max_w / approx_w : 1.0;
    
    scale([scale_factor, scale_factor, 1])
        text(txt, size=size, font=font_testo, halign="center", valign="center");
}

module draw_3d_design(profondita) {
    max_w = larghezza_top - 2; // margine per evitare che tocchi i bordi
    
    if (scelta_design == 1) { // Solo Testo
        color(colore_testo)
        linear_extrude(profondita) {
            if (len(testo_riga2) > 0) {
                translate([0, dimensione_design/2 + 0.5])
                    smart_text(testo_riga1, dimensione_design, max_w);
                translate([0, -dimensione_design/2 - 0.5])
                    smart_text(testo_riga2, dimensione_design, max_w);
            } else {
                smart_text(testo_riga1, dimensione_design, max_w);
            }
        }
    } else if (scelta_design == 2) { // Solo Cuore
        color(colore_simbolo)
            linear_extrude(profondita)
            cuore(dimensione_design * 2);
    } else if (scelta_design == 3) { // Testo e Cuore
        color(colore_testo)
            translate([0, dimensione_design/2 + 0.5])
            linear_extrude(profondita)
            smart_text(testo_riga1, dimensione_design, max_w);
            
        color(colore_simbolo)
            translate([0, -dimensione_design/2 - 1.5])
            linear_extrude(profondita)
            cuore(dimensione_design * 1.5);
    } else if (scelta_design == 4) { // Stella
        color(colore_simbolo)
            linear_extrude(profondita)
            stella(5, dimensione_design * 1.2, dimensione_design * 0.5);
    }
}

module cuore(size) {
    scale_factor = size / 17.07;
    scale([scale_factor, scale_factor, 1])
    translate([0, -7.803])
    rotate([0, 0, 45]) {
        square([10, 10]);
        translate([5, 10]) circle(r=5);
        translate([10, 5]) circle(r=5);
    }
}

module stella(punte, raggio_est, raggio_int) {
    polygon([
        for (i = [0 : punte * 2 - 1])
            let (r = i % 2 == 0 ? raggio_est : raggio_int)
            let (a = i * 360 / (punte * 2) + 90)
            [r * cos(a), r * sin(a)]
    ]);
}

// Genera l'anello
signet_ring();
