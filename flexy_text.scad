// ==============================================================================
// FLEXI TEXT GENERATOR - CERNIERE MAKERLAB (PRINT-IN-PLACE)
// ==============================================================================

/* [1. TESTO] */
text_string = "FLEXI";
text_string_2 = "";
text_align = "center"; // [left, center, right]
letter_spacing = 0.8; // [0.5:0.05:1.5]

/* [2. FONT] */
font_name = "Arial:style=Bold"; 
font_bold = 0.5; // [0.0:0.1:3.0]

/* [3. DIMENSIONI] */
font_size = 20; 
thickness_z = 5.0; // Consigliato 5.0 o superiore per cerniere robuste
scale_x = 1.0; 
scale_y = 1.0; 

/* [4. SISTEMA FLEXY CERNIERE (HINGE)] */
num_joints = 2; // [1:5] Numero di cerniere in altezza Y
joint_width = 5.0; // Diametro del barilotto ruotante della cerniera
joint_distance = 1.5; // Distanza del taglio dritto (spazio tra lettere)
add_anchor_bridges = true; // Ponti di fusione invisibili

/* [5. BASE OPZIONALE] */
add_base = false;
base_height = 1.5; 
base_margin = 2.0; 

/* [6. PARAMETRI AVANZATI] */
clearance = 0.4; // [0.1:0.05:1.0] Gap per evitare la fusione (fondamentale)
edge_rounding = 0.2; 
fast_preview = false;

/* [7. OUTPUT] */
render_mode = "all"; // [all, text_only, joints_only, base_only]

// --- IMPOSTAZIONI GLOBALI ---
$fn = fast_preview ? 16 : 64;
c_width = font_size * letter_spacing * scale_x;

// ==============================================================================
// MODULI BASE (TESTO)
// ==============================================================================
module single_char_2d(char) {
    b_val = font_bold;
    e_val = edge_rounding;
    if (b_val == 0 && e_val == 0) {
        text(char, size=font_size, font=font_name, halign="center", valign="center");
    } else {
        if (e_val > 0) {
            offset(r=-e_val, $fn=(fast_preview ? 8 : 16)) 
                offset(r=e_val + b_val, $fn=(fast_preview ? 8 : 16))
                    text(char, size=font_size, font=font_name, halign="center", valign="center");
        } else {
            offset(r=b_val, $fn=(fast_preview ? 8 : 16))
                text(char, size=font_size, font=font_name, halign="center", valign="center");
        }
    }
}

module text_generator(txt) {
    total_w = len(txt) > 0 ? (len(txt) - 1) * c_width : 0;
    x_start = (text_align == "center") ? -total_w / 2 : (text_align == "right") ? -total_w : 0;
    linear_extrude(height=thickness_z) {
        for (i = [0 : len(txt)-1]) {
            if (txt[i] != " ") {
                translate([x_start + i * c_width, 0, 0])
                    scale([scale_x, scale_y, 1])
                        single_char_2d(txt[i]);
            }
        }
    }
}

// ==============================================================================
// CORE: CERNIERA PRINT-IN-PLACE ALLA MAKERLAB (PIN AND HOLE)
// ==============================================================================
module flexi_hinge(width, height, gap, stem_len) {
    clr = clearance; 
    
    r_out = width / 2;
    r_in = max(r_out * 0.45, 1.0); // Perno centrale interno (min 1mm per resistere alla piegatura)
    
    // Piastre di contenimento superiore/inferiore
    plate_th = max(height * 0.2, r_in + 0.2);
    // Altezza cono smussato per la stampabilità senza supporti (45 gradi)
    cone_h = r_in; 
    
    // ----------------------------------------------------
    // PARTE MASCHIO (Lingua fusa alla lettera di sinistra)
    // ----------------------------------------------------
    union() {
        // Gambo (collega perno alla lettera)
        translate([-stem_len, -r_in, plate_th + clr])
            cube([stem_len, r_in * 2, height - (plate_th*2 + clr*2)]); 
            
        // Perno cilindrico centrale
        translate([0, 0, plate_th + clr])
            cylinder(r=r_in, h=height - (plate_th*2 + clr*2), $fn=32); 
            
        // Cono superiore (punta in su, per top della stampata)
        translate([0, 0, height - (plate_th + clr)])
            cylinder(r1=r_in, r2=0, h=cone_h, $fn=32);
            
        // Cono inferiore (punta in giù, senza over-hang drastici sul piatto)
        translate([0, 0, plate_th + clr - cone_h])
            cylinder(r1=0, r2=r_in, h=cone_h, $fn=32);
    }
        
    // ----------------------------------------------------
    // PARTE FEMMINA (Forcella fusa alla lettera di destra)
    // ----------------------------------------------------
    difference() {
        union() {
            // Corpo esterno (barilotto)
            cylinder(r=r_out, h=height, $fn=32);
            // Gambo femmina (collega barilotto alla lettera destra)
            translate([0, -r_out, 0])
                cube([stem_len, r_out*2, height]);
        }
        
        // SOTTRAZIONI PER CREARE MECCANISMO A CERNIERA:
        // 1. Scasso centrale orizzontale (spazio dove alloggia la lingua maschio)
        translate([0, 0, plate_th])
            cylinder(r=r_in + clr, h=height - plate_th*2, $fn=32);
            
        // 2. Fessura aperta verso sinistra (consente la rotazione del gambo maschio fungendo da U-bracket)
        translate([r_in, 0, plate_th])
            linear_extrude(height - plate_th*2)
                polygon([
                    [0, 0],
                    [-r_out*3, r_out*2.0],
                    [-r_out*3, -r_out*2.0]
                ]);
            
        // 3. Fori conici per incapsulare saldamente i perni rotanti (con tolleranza clr)
        // Foro Top
        translate([0, 0, height - plate_th - 0.01])
            cylinder(r1=r_in + clr, r2=0, h=cone_h + clr, $fn=32);
        // Foro Bottom
        translate([0, 0, plate_th - cone_h - clr + 0.01])
            cylinder(r1=0, r2=r_in + clr, h=cone_h + clr, $fn=32);
    }
}

// ==============================================================================
// SISTEMA SLICER: TAGLI E SPAZI
// ==============================================================================
// Crea blocchi solidi pieni in mezzo per assicurare continuità della fusione prima del taglio
module local_anchors(txt) {
    total_w = len(txt) > 0 ? (len(txt) - 1) * c_width : 0;
    x_start = (text_align == "center") ? -total_w / 2 : (text_align == "right") ? -total_w : 0;
              
    if (len(txt) > 1) {
        for (i = [0 : len(txt)-2]) {
            if (txt[i] != " " && txt[i+1] != " ") {
                gap_x = x_start + i * c_width + c_width / 2;    
                translate([gap_x, 0, thickness_z/2])
                    cube([c_width * 0.8, font_size * 0.8 * scale_y, thickness_z], center=true);
            }
        }
    }
}

// Strumento tagliente che incide esattamente lo scasso circolare per la cerniera e il gap verticale
module cutting_tool(gap_x, act_num, act_w, dist_y) {
    r_cut = (act_w / 2) + clearance; 
    
    // Fessura piana di separazione netta tra i due body
    translate([gap_x, 0, thickness_z/2])
        cube([joint_distance, font_size * 5, thickness_z * 4], center=true);
        
    // Scassi localizzati circolari che avvolgono perfettamente le cerniere permettendogli di ruotare
    if (act_num == 1) {
        translate([gap_x, 0, -thickness_z]) cylinder(r=r_cut, h=thickness_z*4, $fn=32);
    } else {
        step = dist_y / (act_num - 1);
        for (j = [0 : act_num-1]) {
            y_offset = -dist_y/2 + j * step;
            translate([gap_x, y_offset, -thickness_z])
                cylinder(r=r_cut, h=thickness_z*4, $fn=32);
        }
    }
}

module cut_slits(txt) {
    total_w = len(txt) > 0 ? (len(txt) - 1) * c_width : 0;
    x_start = (text_align == "center") ? -total_w / 2 : (text_align == "right") ? -total_w : 0;
              
    if (len(txt) > 1) {
        for (i = [0 : len(txt)-2]) {
            if (txt[i] != " " && txt[i+1] != " ") {
                gap_x = x_start + i * c_width + c_width / 2;
                actual_num = num_joints;
                actual_w = joint_width;
                dist_y = font_size * 0.5 * scale_y;
                
                cutting_tool(gap_x, actual_num, actual_w, dist_y);
            }
        }
    }
}

module connector_system(txt) {
    total_w = len(txt) > 0 ? (len(txt) - 1) * c_width : 0;
    x_start = (text_align == "center") ? -total_w / 2 : (text_align == "right") ? -total_w : 0;
              
    if (len(txt) > 1) {
        for (i = [0 : len(txt)-2]) {
            if (txt[i] != " " && txt[i+1] != " ") {
                gap_x = x_start + i * c_width + c_width / 2;
                actual_num = num_joints;
                actual_w = joint_width;
                dist_y = font_size * 0.5 * scale_y;
                stem_len = c_width * 0.4; // Lunghezza bracci (dritto fino alla lettera vicina)
                
                if (actual_num == 1) {
                    translate([gap_x, 0, 0]) flexi_hinge(actual_w, thickness_z, joint_distance, stem_len);
                } else {
                    step = dist_y / (actual_num - 1);
                    for (j = [0 : actual_num-1]) {
                        y_offset = -dist_y/2 + j * step;
                        translate([gap_x, y_offset, 0])
                            flexi_hinge(actual_w, thickness_z, joint_distance, stem_len);
                    }
                }
            }
        }
    }
}

// ==============================================================================
// BASE OPZIONALE
// ==============================================================================
module single_base_segment(w, h) {
    minkowski() {
        square([w - 2, h - 2], center=true);
        circle(r=1, $fn=(fast_preview ? 8 : 16));
    }
}

module base_plate(txt) {
    if (add_base && len(txt) > 0) {
        total_w = (len(txt) - 1) * c_width;
        x_start = (text_align == "center") ? -total_w / 2 : (text_align == "right") ? -total_w : 0;
                  
        gap_w = joint_distance + clearance; 
        base_w = c_width - gap_w;
        base_h = font_size * 1.2 * scale_y + base_margin * 2;
        
        for (i = [0 : len(txt)-1]) {
            if (txt[i] != " ") {
                x_pos = x_start + i * c_width;
                translate([x_pos, 0, -base_height])
                    linear_extrude(height=base_height)
                        single_base_segment(base_w, base_h);
            }
        }
    }
}

// ==============================================================================
// ASSEMBLAGGIO FINALE 
// ==============================================================================
module slicer_flexi_line(txt) {
    if (render_mode == "all" || render_mode == "text_only") {
        difference() {
            // 1. Corpo compatto primario
            union() {
                text_generator(txt);
                if (add_anchor_bridges) {
                    local_anchors(txt);
                }
            }
            // 2. Differenza: scava l'impronta che accoglie esattamente le cerniere print-in-place
            cut_slits(txt);
        }
    }

    // 3. Drop in-place delle vere cerniere meccaniche ad incastro (Perno e Forcella)
    if (render_mode == "all" || render_mode == "joints_only") {
        connector_system(txt);
    }
    
    // 4. Base Incastrata (Opzionale)
    if (render_mode == "all" || render_mode == "base_only") {
        base_plate(txt);
    }
}

module full_assembly() {
    y_gap = font_size * 1.2 * scale_y + base_margin * 1.5;
    
    slicer_flexi_line(text_string);
    
    if (text_string_2 != "") {
        translate([0, -y_gap, 0])
            slicer_flexi_line(text_string_2);
    }
}

// Render finale
full_assembly();
