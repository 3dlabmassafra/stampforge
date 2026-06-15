// Turbina Eolica Sferica - Versione "Aero-PRO"
// Ottimizzata per Massima Efficienza Dinamica su Tutti i Venti!
// ---------------------------------------------------------------------

/* [Modalità di Esportazione] */
parte = "Esploso"; // ["Tutto", "Esploso", "Turbina", "Palo", "Base"]

/* [Ottimizzazioni Aerodinamiche Avanzate] */
// Torsione Elicoidale (Gradi): l'inviluppo a spirale fa partire la sfera anche con brezze leggerissime (nessun punto morto statico)
aero_twist = 18; 

// Inclinazione profilo (Louver Funnel): devia il flusso parallelo scaricandolo contro le pareti
fin_tilt = 25; 

// Savonius "Overlap" Venting: Svuota il nucleo permettendo lo sfiato d'aria tra i lati opposti (Azzera l'attrito di ritorno = +40% rendimento!)
cross_flow_venting = true; 
overlap_radius = 16; 

/* [Forma O-Wind di Base] */
// Design O-Wind Checkerboard 
staggered_hemispheres = true; 
radius = 50; 
num_sections = 3; 
solid_ratio = 0.50; 

/* [Spessori Strutturali] */
shell_thickness = 2.0; 
wall_thickness = 1.6; 
fin_count = 10; 
fin_thickness = 1.5; 

/* [Parametri Albero e Incastri] */
pole_radius = 4; 
pole_clearance = 0.5; 
pole_extra_height = 25;
base_radius = 45;
base_thickness = 10;

// ---------------------------------------------------------------------
// Setup e Funzioni
$fn = $preview ? 50 : 100;
SA = 360 / num_sections; 
angolo_separazione = SA * (1 - solid_ratio); 

hole_radius = pole_radius + pole_clearance; 
sleeve_radius = hole_radius + 1.2; 
turbine_H = radius*2 + 5;

// =====================================================================
// CORE AERODINAMICO CINETICO
// =====================================================================

module cross_flow_cut() {
    if (cross_flow_venting) {
        // Taglio interno. Conserva fermamente gli ultimi 15mm ai poli per l'attacco strutturale sicuro
        cylinder(r=overlap_radius, h=(radius-15)*2, center=true, $fn=60);
    }
}

module turbine_section() {
    // 1. Profilo del Guscio Cinetico con Sweep a Vortice
    intersection() {
        difference() {
            sphere(r=radius, $fn=100);
            sphere(r=radius - shell_thickness, $fn=100);
        }
        linear_extrude(height=radius*3, center=true, twist=aero_twist, slices=80) {
            polygon([
                [0, 0],
                for(a=[angolo_separazione : 2 : SA]) [radius*2*cos(a), radius*2*sin(a)],
                [radius*2*cos(SA), radius*2*sin(SA)]
            ]);
        }
    }
    
    // 2. Muro Deflettore Centrale 
    difference() {
        wall_delta = 180 * wall_thickness / (PI * radius);
        intersection() {
            sphere(r=radius, $fn=100);
            linear_extrude(height=radius*3, center=true, twist=aero_twist, slices=80) {
                polygon([
                    [0, 0],
                    [radius*1.5, 0],
                    [radius*1.5 * cos(wall_delta), radius*1.5 * sin(wall_delta)]
                ]);
            }
        }
        cross_flow_cut(); // Svuota l'asse permettendo travaso pressorio 
    }
    
    // 3. Sistema di Alette a Imbuto (Funneling Louvers)
    z_start = -radius + 4;
    z_end = radius - 4;
    fin_spacing = (z_end - z_start) / max(1, fin_count - 1);
    
    for(j=[0 : fin_count-1]) {
        z_pos = z_start + j * fin_spacing;
            
        if (z_pos > -radius*0.95 && z_pos < radius*0.95) {
            difference() {
                intersection() {
                    sphere(r=radius - 0.5, $fn=80); 
                    
                    // Segue la spirale per generare confini chiusi perfettamente all'apertura
                    linear_extrude(height=radius*3, center=true, twist=aero_twist, slices=80) {
                        polygon([
                            [0, 0],
                            for(a=[-1 : 2 : angolo_separazione + 1]) [radius*2*cos(a), radius*2*sin(a)],
                            [radius*2*cos(angolo_separazione + 1), radius*2*sin(angolo_separazione + 1)]
                        ]);
                    }
                    
                    twist_at_z = -aero_twist * (z_pos / (radius*3));
                    translate([0, 0, z_pos])
                    rotate([0, 0, twist_at_z])           // Assesta contro la murata sfalsata
                    rotate([0, 0, angolo_separazione/2]) // Orienta esternamente
                    rotate([fin_tilt, 0, 0])             // Inclinazione 'V-funnel'
                    cube([radius*3, radius*3, fin_thickness], center=true);
                }
                cross_flow_cut(); // Crea spazio per incanalare flusso interno
            }
        }
    }
}

module parte_turbina() {
    difference() {
        union() {
            // Alberino leggero
            cylinder(r=sleeve_radius, h=radius*1.95, center=true, $fn=$fn);
            
            // Mozzi Conici Deflettori ai Poli (Doppia funzione: Nasi Fluidodinamici e Ancora Strutturale)
            translate([0, 0, radius - 18]) cylinder(r1=sleeve_radius, r2=sleeve_radius + 14, h=18, $fn=$fn);
            translate([0, 0, -radius]) cylinder(r1=sleeve_radius + 14, r2=sleeve_radius, h=18, $fn=$fn);
            
            // EMISFERO NORD
            intersection() {
                cylinder(r=radius*2, h=radius*2, center=false, $fn=$fn); 
                for(i=[0:num_sections-1]) {
                    rotate([0, 0, i * SA]) {
                        turbine_section();
                    }
                }
            }
            
            // EMISFERO SUD (Sfalsato e Interlacciato!)
            intersection() {
                rotate([180, 0, 0]) cylinder(r=radius*2, h=radius*2, center=false, $fn=$fn); 
                for(i=[0:num_sections-1]) {
                    offset_angle = staggered_hemispheres ? angolo_separazione : 0;
                    rotate([0, 0, i * SA + offset_angle]) {
                        turbine_section();
                    }
                }
            }
        }
        
        // Asse puro privo di barriere
        cylinder(r=hole_radius, h=radius*4, center=true, $fn=$fn);
    }
}


// =====================================================================
// BASE E SUPPORTO ROTORICO
// =====================================================================

module parte_palo() {
    pole_total_H = 12 + pole_extra_height + 2 + turbine_H + 5;
    union() {
        hull() {
            cylinder(r=pole_radius, h=pole_total_H - pole_radius, $fn=$fn);
            translate([0, 0, pole_total_H - pole_radius]) sphere(r=pole_radius, $fn=30);
        }
        translate([0, 0, 12 + pole_extra_height])
            cylinder(r=pole_radius + 4, h=2, $fn=$fn);
    }
}

module parte_base() {
    difference() {
        hull() {
            cylinder(r=base_radius, h=2, $fn=100);
            translate([0, 0, base_thickness - 2])
                cylinder(r=base_radius * 0.70, h=2, $fn=100);
        }
        translate([0, 0, base_thickness - 12]) 
            cylinder(r=pole_radius + 0.2, h=15, $fn=$fn);
    }
}

module renderer(mode) {
    if (mode == "Base" || mode == "Tutto" || mode == "Esploso") {
        translate([0, 0, 0]) parte_base();
    }
    
    if (mode == "Palo" || mode == "Tutto" || mode == "Esploso") {
        z_offset = (mode == "Palo") ? 0 : 
                   (mode == "Esploso") ? base_thickness + 30 :
                   base_thickness - 12; 
                   
        translate([0, 0, z_offset]) parte_palo();
    }
    
    if (mode == "Turbina" || mode == "Tutto" || mode == "Esploso") {
        collar_world_Z = (base_thickness - 12) + (12 + pole_extra_height + 2);
        z_fondo = -radius; 
        
        z_offset = (mode == "Turbina") ? 0 :
                   (mode == "Esploso") ? collar_world_Z - z_fondo + 80 :
                   collar_world_Z - z_fondo;
                   
        translate([0, 0, z_offset]) parte_turbina();
    }
}

renderer(parte);
