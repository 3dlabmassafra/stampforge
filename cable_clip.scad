// ============================================================
//   CLIP FERMA CAVO PRINT-IN-PLACE
//   Design parametrico con cerniera e chiusura a scatto
// ============================================================

/* [Clip Ferma Cavo] */
// Numero di cavi da gestire
num_cables = 3; // [1:1:10]
// Diametro dei cavi in mm (5.5 è ottimo per USB-C)
cable_dia = 5.5; // [3:0.1:15]
// Lunghezza della clip lungo il cavo
clip_length = 20; // [10:1:50]

/* [Tolleranze e Stampa] */
// Tolleranza per la cerniera print-in-place (0.4 consigliata per PLA)
pip_clearance = 0.4; // [0.1:0.1:0.8]
// Durezza dello scatto (maggiore = più forte ma richiede più flessione)
snap_depth = 0.8; // [0.4:0.1:1.5]

/* [Avanzate] */
// Risoluzione curve
$fn = 64; 
// Spessore delle pareti solide
wall = 2.5; 
// Raggio della cerniera
hinge_r = 2.5; 

// Calcoli geometrici
base_h = 2.0 + cable_dia / 2;
cable_pitch = cable_dia + 2.0;
first_cable_x = hinge_r * 2 + wall + cable_dia / 2;
Base_end_X = first_cable_x + (num_cables - 1) * cable_pitch + cable_dia / 2 + wall;
Top_body_w = Base_end_X + pip_clearance;
Top_arm_X = -Top_body_w;
arm_thick = 2.0;

// ============================================================
// MODULI DI BASE
// ============================================================

module teardrop_pin(r, l) {
    // Perno a forma di goccia per stampabilità senza supporti
    rotate([-90, 0, 0])
    linear_extrude(height=l)
    hull() {
        circle(r=r);
        polygon([[-r*sin(45), r*cos(45)], [r*sin(45), r*cos(45)], [0, r / sin(45)]]);
    }
}

// ============================================================
// PARTI PRINCIPALI
// ============================================================

module base_part() {
    k_length = min(5, clip_length / 4);
    
    union() {
        // Nocche della cerniera (Knuckles) - Base ne ha 2 esterne
        translate([0, 0, 0]) 
            cube([hinge_r*2, k_length, base_h]);
        translate([0, clip_length - k_length, 0]) 
            cube([hinge_r*2, k_length, base_h]);
        
        // Perno centrale (Pin)
        translate([0, 0, base_h]) 
            teardrop_pin(hinge_r, clip_length);
            
        // Corpo Principale Base
        difference() {
            // Blocco base arrotondato sul fondo
            hull() {
                translate([0, 0, 0]) cube([Base_end_X, clip_length, base_h - 1]);
                translate([0, 0, base_h - 1]) cube([Base_end_X, clip_length, 1]);
            }
            
            // Scanalature per i cavi
            for(i=[0:num_cables-1]) {
                translate([first_cable_x + i*cable_pitch, -1, base_h])
                    rotate([-90, 0, 0])
                        cylinder(h=clip_length + 2, r=cable_dia/2);
                
                // Leggero invito per l'inserimento
                translate([first_cable_x + i*cable_pitch, -1, base_h])
                    rotate([-90, 0, 0])
                        cylinder(h=clip_length + 2, r1=cable_dia/2 + 0.5, r2=cable_dia/2);
            }
        }
        
        // Dente a scatto (Snap Ridge)
        translate([Base_end_X, 0, base_h / 2])
            rotate([-90, 0, 0])
                linear_extrude(height=clip_length)
                    polygon([[0, -1.2], [snap_depth, 0], [0, 1.2]]);
    }
}

module top_part() {
    k_length = min(5, clip_length / 4);
    
    union() {
        // Nocca centrale
        difference() {
            translate([-hinge_r*2, k_length + pip_clearance, 0])
                cube([hinge_r*2, clip_length - 2*k_length - 2*pip_clearance, base_h]);
                
            // Foro per il perno (con tolleranza)
            translate([0, -1, base_h]) 
                teardrop_pin(hinge_r + pip_clearance, clip_length + 2);
        }
        
        // Corpo Principale Top
        translate([-Top_body_w, 0, 0])
            difference() {
                cube([Top_body_w, clip_length, base_h]);
                
                // Scanalature per i cavi (speculari)
                for(i=[0:num_cables-1]) {
                    translate([Top_body_w - (first_cable_x + i*cable_pitch), -1, base_h])
                        rotate([-90, 0, 0])
                            cylinder(h=clip_length + 2, r=cable_dia/2);
                }
            }
            
        // Braccio Flessibile a Scatto (Snap Arm)
        translate([Top_arm_X - arm_thick, 0, 0])
            hull() {
                cube([arm_thick, clip_length, base_h * 2 - 2]);
                // Arrotondamento superiore
                translate([arm_thick, 0, base_h * 2 - 2])
                    rotate([-90, 0, 0])
                        cylinder(h=clip_length, r=2);
            }
            
        // Gancio dello Scatto (Snap Hook)
        translate([Top_arm_X, 0, base_h * 1.5])
            rotate([-90, 0, 0])
                linear_extrude(height=clip_length)
                    polygon([[0, -1.2], [snap_depth, 0], [0, 1.2]]);
    }
}

// ============================================================
// ASSEMBLAGGIO FINALE
// ============================================================

// Stampa in piano: La parte base e la parte superiore vengono stampate affiancate.
// Nessun supporto è necessario. Dopo la stampa, piega la parte superiore di 180 gradi.

base_part();
top_part();
