// =====================================================================
// SCATOLA PARAMETRICA STILE FUNKO POP PER MAKERLAB
// =====================================================================

/* [Dimensioni Scatola Base] */
// Larghezza (Lato principale / Fronte)
Width = 115; // [10:1:250]
// Profondita (Laterali)
Depth = 90;  // [10:1:200]
// Altezza (Verticale)
Height = 160; // [10:1:250]

/* [Scala] */
// Scala globale uniforme (moltiplica tutte le dimensioni tranne gli spessori)
Global_Scale = 1.0; // [0.1:0.01:3.0]

/* [Testi Scatola] */
// Lascia vuoto un campo per rimuovere quel testo
Testo_Centrale_Fronte = "3D Lab Massafra";
Testo_In_Alto_Fronte = "";
Testo_In_Basso_Fronte = "";
Testo_Lato_Sinistro = "";
Testo_Lato_Destro = "";
Testo_Retro = "";
Testo_Coperchio = "";

/* [Colori (Anteprima e Multi-Color)] */
Box_Color = "#EEEEEE";
Text_Color = "#E62222";

/* [Stampante Bambu Lab / Piatto] */
Printer = "P1_X1_A1"; // ["A1_Mini":A1 Mini (180x180), "P1_X1_A1":P1 / X1 / A1 (256x256)]
// Mostra il piatto per capire se la scatola stesa ci sta
Show_Build_Plate = true;

/* [Finestra Anteriore] */
include_window = true;

/* [Texture Esterna] */
// Aggiunge una trama incisa all'esterno della scatola
Texture_Style = "Nessuna"; // ["Nessuna", "Righe", "Griglia"]
Texture_Depth = 0.2; // [0.1:0.1:1.0]
Texture_Spacing = 8; // [2:1:30]

/* [Stile Testo] */
font_size = 10; // [3:1:30]
text_depth = 0.4; // [0.1:0.1:1.0]
// Inciso = scavenger nel muro, Rilievo = sporge, Foro = passa da parte a parte
text_style = "Embossed"; // ["Engraved", "Embossed", "Cutout"]
font_name = "Liberation Sans:style=Bold"; 

/* [Impostazioni Fabbricazione Stampa 3D] */
wall_thickness = 1.30; // [0.4:0.1:3.0]
hinge_thickness = 0.2; // [0.1:0.05:0.6]
hinge_gap = 1.0; // [0.5:0.1:3.0]
tab_size = 15; // [5:1:30]


// =====================================================================
// CALCOLI E POSIZIONAMENTI (Non toccare sotto)
// =====================================================================

$fn = 30;

// Dimensioni Piatto Stampante
plate_size_x = (Printer == "A1_Mini") ? 180 : 256;
plate_size_y = (Printer == "A1_Mini") ? 180 : 256;

// Dimensioni Scalate
s_Width = Width * Global_Scale;
s_Depth = Depth * Global_Scale;
s_Height = Height * Global_Scale;
s_tab_size = tab_size * Global_Scale;
s_flap_size = s_Depth * 0.4;

s_wall_thickness = wall_thickness;         // Lo spessore del muro non viene scalato
// Il gap deve essere almeno il doppio dello spessore per permettere la piega a 90° verso il basso
s_hinge_gap = max(hinge_gap * Global_Scale, s_wall_thickness * 2.2); 
s_hinge_thickness = hinge_thickness;       // spessore cerniera rimane fisso per stamparsi bene a layer singolo/doppio

// Coordinate pannelli per il layout steso
x_left  = 0;
x_h1    = s_Depth;
x_front = s_Depth + s_hinge_gap;
x_h2    = x_front + s_Width;
x_right = x_h2 + s_hinge_gap;
x_h3    = x_right + s_Depth;
x_back  = x_h3 + s_hinge_gap;
x_h4    = x_back + s_Width;
x_glue  = x_h4 + s_hinge_gap;

total_width = x_glue + s_tab_size;
total_height = s_Height + s_Depth * 2 + s_hinge_gap * 2 + s_tab_size * 2;


// =====================================================================
// MODULI GEOMETRICI E FUNZIONI
// =====================================================================

module build_plate() {
    if (Show_Build_Plate) {
        // Centra il piatto rispetto all'ingombro globale del pezzo
        %translate([total_width/2 - plate_size_x/2, s_Height/2 - plate_size_y/2, -0.5])
            color("#444444", 0.5) cube([plate_size_x, plate_size_y, 0.5]);
    }
}

module draw_hinge(w, h) {
    color(Box_Color)
    translate([0, 0, s_wall_thickness - s_hinge_thickness])
        linear_extrude(s_hinge_thickness)
            square([w, h]);
}

module dust_flap_shape(w, h) {
    polygon([
        [0.5, 0], [w-0.5, 0],
        [w*0.85, h], [w*0.15, h]
    ]);
}

module tuck_flap_shape(w, h) {
    polygon([
        [1.0, 0], [w-1.0, 0], 
        [w*0.9, h], [w*0.1, h]
    ]);
}

module glue_flap_shape(w, h) {
    polygon([
        [0, 1.0], [0, h-1.0], 
        [w, h-4.0], [w, 4.0]
    ]);
}

// Generatore testi per tutti i pannelli
module apply_texts(w, h, p_type) {
    s_fsize = font_size * Global_Scale;
    extr_h = (text_style == "Cutout") ? s_wall_thickness + 0.2 : text_depth + 0.1;
    
    // Per garantire la faccia liscia sul piatto (Z=0), tutto il lato "Esterno" della scatola 
    // su cui andiamo a scavare/sporgere si trova in cima (Z = s_wall_thickness).
    z_pos = (text_style == "Cutout")   ? -0.1 : 
            (text_style == "Engraved") ? s_wall_thickness - text_depth + 0.01 : 
                                         s_wall_thickness;

    color(Text_Color)
    translate([0, 0, z_pos]) linear_extrude(extr_h) {
        if (p_type == "front") {
            if (Testo_In_Alto_Fronte != "") 
                translate([w/2, h*0.85]) text(Testo_In_Alto_Fronte, size=s_fsize*1.2, font=font_name, halign="center", valign="center");
            if (Testo_Centrale_Fronte != "") 
                translate([w/2, h/2]) text(Testo_Centrale_Fronte, size=s_fsize*1.8, font=font_name, halign="center", valign="center");
            if (Testo_In_Basso_Fronte != "") 
                translate([w/2, h*0.15]) text(Testo_In_Basso_Fronte, size=s_fsize*1.2, font=font_name, halign="center", valign="center");
        }
        else if (p_type == "left") {
            if (Testo_Lato_Sinistro != "") 
                translate([w/2, h/2]) text(Testo_Lato_Sinistro, size=s_fsize*1.5, font=font_name, halign="center", valign="center");
        }
        else if (p_type == "right") {
            if (Testo_Lato_Destro != "") 
                translate([w/2, h/2]) text(Testo_Lato_Destro, size=s_fsize*1.5, font=font_name, halign="center", valign="center");
        }
        else if (p_type == "back") {
            if (Testo_Retro != "") 
                translate([w/2, h/2]) text(Testo_Retro, size=s_fsize*1.5, font=font_name, halign="center", valign="center");
        }
        else if (p_type == "top") {
            if (Testo_Coperchio != "") 
                translate([w/2, h/2]) text(Testo_Coperchio, size=s_fsize*1.5, font=font_name, halign="center", valign="center");
        }
    }
}

module apply_texture(w, h) {
    scaled_spacing = Texture_Spacing * Global_Scale;
    z_start = s_wall_thickness - Texture_Depth + 0.01;
    
    if (Texture_Style == "Righe") {
        for (y = [0 : scaled_spacing : h]) {
            translate([-1, y, z_start]) cube([w+2, scaled_spacing*0.3, Texture_Depth + 0.1]);
        }
    } else if (Texture_Style == "Griglia") {
        for (y = [0 : scaled_spacing : h]) {
            translate([-1, y, z_start]) cube([w+2, scaled_spacing*0.3, Texture_Depth + 0.1]);
        }
        for (x = [0 : scaled_spacing : w]) {
            translate([x, -1, z_start]) cube([scaled_spacing*0.3, h+2, Texture_Depth + 0.1]);
        }
    }
}

// Pannello Base personalizzato con finestre e testi specifici per tipo
module custom_panel(w, h, p_type) {
    // 1. Text Embossed -> We add it using Union
    // 2. Text Engraved/Cutout & Window & Texture -> We subtract them using Difference
    
    union() {
        difference() {
            color(Box_Color)
            linear_extrude(s_wall_thickness) square([w, h]);
            
            // Finestra (solo fronte)
            if (p_type == "front" && include_window) {
                translate([w*0.4, h*0.35, -0.1])
                    linear_extrude(s_wall_thickness + 0.2)
                        square([w*0.55, h*0.5]); 
            }
            
            // Texture incisa nelle pareti
            if (Texture_Style != "Nessuna") {
                apply_texture(w, h);
            }
            
            // Testo Inciso o Forato
            if (text_style == "Engraved" || text_style == "Cutout") {
                apply_texts(w, h, p_type);
            }
        }
        
        // Testo in Rilievo
        if (text_style == "Embossed") {
            apply_texts(w, h, p_type);
        }
    }
}


// =====================================================================
// ASSEMBLAGGIO (Costruzione progressiva 3D del Layout Piatto)
// =====================================================================

// Centriamo intero sviluppo per facilitare posizionamento su piatto
translate([-total_width/2, -s_Height/2, 0]) {

    // --- PIATTO STAMPANTE (Pre-visualizzazione) ---
    build_plate();

    // --- PANNELLO SINISTRO (Left) ---
    translate([x_left, 0, 0]) {
        custom_panel(s_Depth, s_Height, "left");
        
        translate([0, s_Height, 0]) draw_hinge(s_Depth, s_hinge_gap);
        color(Box_Color) translate([0, s_Height+s_hinge_gap, 0]) linear_extrude(s_wall_thickness) dust_flap_shape(s_Depth, s_flap_size);
        
        translate([0, 0, 0]) mirror([0,1,0]) {
            draw_hinge(s_Depth, s_hinge_gap);
            color(Box_Color) translate([0, s_hinge_gap, 0]) linear_extrude(s_wall_thickness) dust_flap_shape(s_Depth, s_flap_size);
        }
    }
    translate([x_h1, 0, 0]) draw_hinge(s_hinge_gap, s_Height);
    
    
    // --- PANNELLO FRONTALE (Front) ---
    translate([x_front, 0, 0]) {
        custom_panel(s_Width, s_Height, "front");
        
        // Tetto e Linguetta
        translate([0, s_Height, 0]) {
            draw_hinge(s_Width, s_hinge_gap);
            translate([0, s_hinge_gap, 0]) {
                custom_panel(s_Width, s_Depth, "top"); 
                translate([0, s_Depth, 0]) {
                    draw_hinge(s_Width, s_hinge_gap);
                    color(Box_Color) translate([0, s_hinge_gap, 0]) linear_extrude(s_wall_thickness) tuck_flap_shape(s_Width, s_tab_size);
                }
            }
        }
        
        // Fondo e Linguetta
        translate([0, 0, 0]) mirror([0,1,0]) {
            draw_hinge(s_Width, s_hinge_gap);
            translate([0, s_hinge_gap, 0]) {
                custom_panel(s_Width, s_Depth, "bottom"); 
                translate([0, s_Depth, 0]) {
                    draw_hinge(s_Width, s_hinge_gap);
                    color(Box_Color) translate([0, s_hinge_gap, 0]) linear_extrude(s_wall_thickness) tuck_flap_shape(s_Width, s_tab_size);
                }
            }
        }
    }
    translate([x_h2, 0, 0]) draw_hinge(s_hinge_gap, s_Height);
    
    
    // --- PANNELLO DESTRO (Right) ---
    translate([x_right, 0, 0]) {
        custom_panel(s_Depth, s_Height, "right");
        
        translate([0, s_Height, 0]) draw_hinge(s_Depth, s_hinge_gap);
        color(Box_Color) translate([0, s_Height+s_hinge_gap, 0]) linear_extrude(s_wall_thickness) dust_flap_shape(s_Depth, s_flap_size);
        
        translate([0, 0, 0]) mirror([0,1,0]) {
            draw_hinge(s_Depth, s_hinge_gap);
            color(Box_Color) translate([0, s_hinge_gap, 0]) linear_extrude(s_wall_thickness) dust_flap_shape(s_Depth, s_flap_size);
        }
    }
    translate([x_h3, 0, 0]) draw_hinge(s_hinge_gap, s_Height);
    
    
    // --- PANNELLO POSTERIORE (Back) ---
    translate([x_back, 0, 0]) {
        custom_panel(s_Width, s_Height, "back");
    }
    translate([x_h4, 0, 0]) draw_hinge(s_hinge_gap, s_Height);
    
    
    // --- LINGUETTA DI CHIUSURA/COLLA LATERALE ---
    translate([x_glue, 0, 0]) {
        color(Box_Color) linear_extrude(s_wall_thickness) glue_flap_shape(s_tab_size, s_Height);
    }
}
