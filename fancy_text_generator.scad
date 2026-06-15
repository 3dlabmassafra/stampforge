
// ============================================================
//   FANCY 3D TEXT GENERATOR  — MakerWorld Ready
//   Testo 3D con 16 effetti speciali sulle lettere
//   Compatibile con MakerWorld Customizer
// ============================================================
//   Versione: 2.0
// ============================================================

/* [Testo] */
// Il testo da generare
text_string = "YOUR TEXT";

// Dimensione lettera (altezza in mm)
letter_size = 12;  // [5:1:40]

// Profondità / altezza delle lettere (mm)
letter_depth = 7;  // [2:0.5:25]

// Spaziatura extra tra le lettere (mm)
letter_spacing = 0.5; // [0:0.1:6]

/* [Colori] */
// Colore del testo
text_color = "Red"; // ["Red", "Black", "White", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Gold", "Silver", "Grey"]

// Colore della base
base_color = "Black"; // ["Black", "Red", "White", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Gold", "Silver", "Grey"]

/* [Portachiavi] */
// Aggiungi occhiello portachiavi (valido se c'è una base)
add_keychain_loop = true;

// Diametro foro portachiavi (mm)
keychain_hole_diameter = 4; // [2:0.5:10]

/* [Font] */
// Scegli il font
font_style = "Liberation Sans:style=Bold"; // ["Liberation Sans:style=Bold","Liberation Serif:style=Bold","Liberation Mono:style=Bold","Orbitron:style=Bold","Russo One","Bebas Neue","Anton","Black Han Sans","Bangers","Fredoka One","Pacifico","Righteous","Alfa Slab One","Permanent Marker","Rock Salt","Oswald:style=Bold","Rajdhani:style=Bold","Teko:style=Bold"]

/* [Stile Lettera] */
// Effetto 3D sulla lettera
letter_shape = "Twisted"; // ["Flat","Bevel","Double_Bevel","Pyramid","Dome","Wave","Crystal","Slope","Twisted","Stepped","Ribbed","Grooved","Honeycomb","Waffle","Voronoi","Engraved"]

// Intensità effetto (0 = minimo, 1 = massimo)
effect_intensity = 0.65; // [0.05:0.05:1.0]

/* [Base] */
// Tipo di base
base_type = "Rounded"; // ["None","Rectangle","Rounded","Frame_Rectangle","Frame_Rounded"]

// Altezza della base (mm)
base_height = 3; // [0:0.5:15]

// Margine della base attorno alle lettere (mm)
base_margin = 4; // [0:0.5:15]

// Spessore del bordo (solo per Frame_*) (mm)
frame_thickness = 3; // [1:0.5:10]

// Altezza del bordo (solo per Frame_*) (mm)
frame_wall_height = 4; // [1:0.5:15]

/* [Avanzato] */
// Qualità curve
$fn = 36; // [12:4:64]

// ============================================================
//  PARAMETRI INTERNI DERIVATI
// ============================================================
_bevel_r  = effect_intensity * letter_depth * 0.48;
_slope_dx = effect_intensity * letter_depth * 0.55;
_dome_ex  = effect_intensity * letter_size  * 0.10;
_wave_amp = effect_intensity * letter_size  * 0.30;
_twist_a  = effect_intensity * 45;           // gradi totali twisting
_steps    = max(2, round(effect_intensity * 8));
_rib_n    = max(3, round(effect_intensity * 14));
_groove_n = max(2, round(effect_intensity * 10));
_hex_r    = letter_size * (0.06 + effect_intensity * 0.07);
_waffle_w = letter_size * (0.05 + effect_intensity * 0.05);
_vor_n    = max(4, round(effect_intensity * 20));
_vor_r    = letter_size * (0.05 + effect_intensity * 0.08);

// ============================================================
//  UTILITY
// ============================================================
function char_at(s, i) = (len(s) > i) ? s[i] : "";

function char_width(ch) =
    let(m = textmetrics(text = ch, size = letter_size, font = font_style))
    m.advance[0] + letter_spacing;

// vettore [0..n] di offset X cumulativi
function _cw(s, i, acc) =
    (i >= len(s)) ? [acc]
    : concat([acc], _cw(s, i + 1, acc + char_width(char_at(s, i))));

function cum_widths(s) = _cw(s, 0, 0);

function total_width(s) =
    let(cw = cum_widths(s)) cw[len(s)];

// pseudo-random da seme intero (LCG)
function rnd(seed) = ((seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

// ============================================================
//  LETTERA BASE
// ============================================================
module base_letter(ch) {
    linear_extrude(height = letter_depth, convexity = 10)
        text(ch,
             size   = letter_size,
             font   = font_style,
             halign = "center",
             valign = "center");
}

// ============================================================
//  EFFETTI
// ============================================================

// 1 — FLAT
module shape_flat(ch) { base_letter(ch); }

// 2 — BEVEL (smusso top, stile dell'esempio nell'immagine)
module shape_bevel(ch) {
    r = _bevel_r;
    sc = max(0.02, 1 - 2 * r / letter_size);
    intersection() {
        base_letter(ch);
        linear_extrude(height = letter_depth,
                        scale = [sc, sc], convexity = 10)
            offset(delta = r)
                text(ch, size = letter_size, font = font_style,
                     halign = "center", valign = "center");
    }
}

// 3 — DOUBLE BEVEL (smusso in basso e in alto)
module shape_double_bevel(ch) {
    r  = _bevel_r * 0.7;
    sc = max(0.05, 1 - 2 * r / letter_size);
    mid = letter_depth / 2;
    union() {
        // metà inferiore: scala cresce da sc a 1
        intersection() {
            base_letter(ch);
            linear_extrude(height = mid, scale = [1/sc, 1/sc], convexity = 10)
                offset(delta = -r)
                    text(ch, size = letter_size, font = font_style,
                         halign = "center", valign = "center");
        }
        // metà superiore: scala decresce da 1 a sc
        translate([0, 0, mid])
        intersection() {
            linear_extrude(height = mid, convexity = 10)
                text(ch, size = letter_size, font = font_style,
                     halign = "center", valign = "center");
            linear_extrude(height = mid, scale = [sc, sc], convexity = 10)
                offset(delta = r)
                    text(ch, size = letter_size, font = font_style,
                         halign = "center", valign = "center");
        }
    }
}

// 4 — PYRAMID (converge verso l'alto)
module shape_pyramid(ch) {
    s = max(0.01, 1 - effect_intensity * 0.96);
    linear_extrude(height = letter_depth, scale = [s, s], convexity = 10)
        text(ch, size = letter_size, font = font_style,
             halign = "center", valign = "center");
}

// 5 — DOME (rigonfiamento centrale, poi si restringe)
module shape_dome(ch) {
    N  = 24;
    dh = letter_depth / N;
    for (i = [0:N-1]) {
        t    = i / (N - 1);
        bell = sin(t * 180);
        sc   = 1 + _dome_ex / letter_size * bell;
        translate([0, 0, i * dh])
            linear_extrude(height = dh + 0.01, scale = [sc, sc], convexity = 4)
                text(ch, size = letter_size, font = font_style,
                     halign = "center", valign = "center");
    }
}

// 6 — WAVE (lettere a diverse altezze come un'onda)
module shape_wave(ch, idx, total) {
    phase = 360 * idx / max(1, total);
    dz    = _wave_amp * sin(phase);
    translate([0, 0, max(0, dz)])
        linear_extrude(height = letter_depth + abs(dz) * 0.3, convexity = 10)
            text(ch, size = letter_size, font = font_style,
                 halign = "center", valign = "center");
}

// 7 — CRYSTAL (gradini che si restringono, facce nette)
module shape_crystal(ch) {
    N    = max(3, _steps + 2);
    dh   = letter_depth / N;
    shrk = effect_intensity * 0.45 / N;
    for (i = [0:N-1]) {
        sc = max(0.05, 1 - i * shrk);
        translate([0, 0, i * dh])
            linear_extrude(height = dh + 0.01, scale = [sc, sc], convexity = 4)
                text(ch, size = letter_size, font = font_style,
                     halign = "center", valign = "center");
    }
}

// 8 — SLOPE (inclinato su un lato)
module shape_slope(ch) {
    N  = 16;
    dh = letter_depth / N;
    for (i = [0:N-1]) {
        t  = i / (N - 1);
        dx = _slope_dx * t;
        translate([dx, 0, i * dh])
            linear_extrude(height = dh + 0.01, convexity = 4)
                text(ch, size = letter_size, font = font_style,
                     halign = "center", valign = "center");
    }
}

// 9 — TWISTED (torsione lungo Z)
module shape_twisted(ch) {
    linear_extrude(height = letter_depth,
                   twist   = _twist_a,
                   slices  = 40,
                   convexity = 12)
        text(ch, size = letter_size, font = font_style,
             halign = "center", valign = "center");
}

// 10 — STEPPED (gradini orizzontali come una ziggurat)
module shape_stepped(ch) {
    N  = _steps;
    dh = letter_depth / N;
    for (i = [0:N-1]) {
        shrink = (N - 1 - i) * effect_intensity * 0.12;
        translate([0, 0, i * dh])
            linear_extrude(height = dh + 0.01, convexity = 6)
                offset(delta = -shrink)
                    text(ch, size = letter_size, font = font_style,
                         halign = "center", valign = "center");
    }
}

// 11 — RIBBED (costole verticali sui lati)
module shape_ribbed(ch) {
    bw = letter_size * 1.5;
    bh = letter_size * 1.2;
    N  = _rib_n;
    rib_w = bw / N;
    intersection() {
        base_letter(ch);
        union() {
            // copia piena per il "corpo" principale
            base_letter(ch);
            // costole: colonne verticali alternately larghezza piena / ristrette
            for (i = [0:N-1]) {
                xpos = -bw/2 + i * rib_w;
                if (i % 2 == 0)
                    translate([xpos, -bh/2, 0])
                        cube([rib_w, bh, letter_depth]);
                else
                    translate([xpos + rib_w*0.15, -bh/2, 0])
                        cube([rib_w * 0.7, bh, letter_depth * 0.6]);
            }
        }
    }
}

// 12 — GROOVED (scanalature orizzontali sui lati)
module shape_grooved(ch) {
    N      = _groove_n;
    groove = letter_depth / (N * 2 + 1);
    difference() {
        base_letter(ch);
        for (i = [0:N-1]) {
            z = groove + i * groove * 2;
            translate([0, 0, z])
                linear_extrude(height = groove + 0.01, convexity = 6)
                    offset(delta = 0.5)
                        text(ch, size = letter_size, font = font_style,
                             halign = "center", valign = "center");
        }
        // scanalature: sottrai uno strato leggermente più grande
        for (i = [0:N-1]) {
            z = groove + i * groove * 2;
            translate([0, 0, z])
                linear_extrude(height = groove, convexity = 6)
                    difference() {
                        offset(delta = 1.2)
                            text(ch, size = letter_size, font = font_style,
                                 halign = "center", valign = "center");
                        offset(delta = -0.01)
                            text(ch, size = letter_size, font = font_style,
                                 halign = "center", valign = "center");
                    }
        }
    }
}

// 13 — HONEYCOMB (fori esagonali sul top)
module shape_honeycomb(ch) {
    hr  = _hex_r;
    gap = hr * 0.15;
    hex_h = letter_depth * effect_intensity * 0.55;
    bw  = letter_size * 2.0;
    bh  = letter_size * 1.4;
    col_dx = hr * 1.73;
    row_dy = hr * 1.5;
    n_cols = ceil(bw / col_dx) + 2;
    n_rows = ceil(bh / row_dy) + 2;
    difference() {
        base_letter(ch);
        for (row = [-n_rows : n_rows]) {
            for (col = [-n_cols : n_cols]) {
                x = col * col_dx + (row % 2 == 0 ? 0 : col_dx / 2);
                y = row * row_dy;
                translate([x, y, letter_depth - hex_h])
                    cylinder(r = hr - gap, h = hex_h + 0.1, $fn = 6);
            }
        }
    }
}

// 14 — WAFFLE (griglia a reticolo incisa sul top)
module shape_waffle(ch) {
    w  = _waffle_w;
    gd = letter_depth * effect_intensity * 0.45;
    bw = letter_size * 2.0;
    bh = letter_size * 1.4;
    step = w * 2.8;
    n_x = ceil(bw / step) + 2;
    n_y = ceil(bh / step) + 2;
    difference() {
        base_letter(ch);
        // canali verticali
        for (i = [-n_x : n_x])
            translate([i * step, 0, letter_depth - gd])
                cube([w, bh * 2, gd + 0.1], center = true);
        // canali orizzontali
        for (j = [-n_y : n_y])
            translate([0, j * step, letter_depth - gd])
                cube([bw * 2, w, gd + 0.1], center = true);
    }
}

// 15 — VORONOI (celle casuali scavate nella lettera)
// Simula celle voronoi sottraendo cilindri/sfere pseudo-random
module shape_voronoi(ch) {
    vr = _vor_r;
    N  = _vor_n;
    bw = letter_size * 1.8;
    bh = letter_size * 1.2;
    vd = letter_depth * effect_intensity * 0.65;

    difference() {
        base_letter(ch);
        for (i = [0 : N - 1]) {
            seed_x = i * 7 + 3;
            seed_y = i * 13 + 17;
            seed_z = i * 5 + 11;
            rx = (rnd(seed_x) - 0.5) * bw;
            ry = (rnd(seed_y) - 0.5) * bh;
            rz = letter_depth - vd + rnd(seed_z) * vd;
            rr = vr * (0.6 + rnd(i * 29 + 7) * 0.8);
            translate([rx, ry, rz])
                sphere(r = rr);
        }
    }
    // bordi delle celle: aggiungi mini-pareti
    for (i = [0 : N - 2]) {
        seed_x1 = i * 7 + 3;
        seed_y1 = i * 13 + 17;
        seed_x2 = (i+1) * 7 + 3;
        seed_y2 = (i+1) * 13 + 17;
        rx1 = (rnd(seed_x1) - 0.5) * bw;
        ry1 = (rnd(seed_y1) - 0.5) * bh;
        rx2 = (rnd(seed_x2) - 0.5) * bw;
        ry2 = (rnd(seed_y2) - 0.5) * bh;
    }
}

// 16 — ENGRAVED (testo incavato su pannello piatto)
module shape_engraved(ch) {
    w  = textmetrics(text = ch, size = letter_size, font = font_style).advance[0] + letter_size * 0.3;
    h  = letter_size * 1.3;
    ed = letter_depth * effect_intensity * 0.6;
    difference() {
        translate([-w/2, -h/2, 0])
            cube([w, h, letter_depth]);
        translate([0, 0, letter_depth - ed])
            linear_extrude(height = ed + 0.1, convexity = 10)
                text(ch, size = letter_size * 0.9, font = font_style,
                     halign = "center", valign = "center");
    }
}

// ============================================================
//  DISPATCHER
// ============================================================
module render_letter(ch, idx, total) {
    if      (letter_shape == "Flat")         shape_flat(ch);
    else if (letter_shape == "Bevel")        shape_bevel(ch);
    else if (letter_shape == "Double_Bevel") shape_double_bevel(ch);
    else if (letter_shape == "Pyramid")      shape_pyramid(ch);
    else if (letter_shape == "Dome")         shape_dome(ch);
    else if (letter_shape == "Wave")         shape_wave(ch, idx, total);
    else if (letter_shape == "Crystal")      shape_crystal(ch);
    else if (letter_shape == "Slope")        shape_slope(ch);
    else if (letter_shape == "Twisted")      shape_twisted(ch);
    else if (letter_shape == "Stepped")      shape_stepped(ch);
    else if (letter_shape == "Ribbed")       shape_ribbed(ch);
    else if (letter_shape == "Grooved")      shape_grooved(ch);
    else if (letter_shape == "Honeycomb")    shape_honeycomb(ch);
    else if (letter_shape == "Waffle")       shape_waffle(ch);
    else if (letter_shape == "Voronoi")      shape_voronoi(ch);
    else if (letter_shape == "Engraved")     shape_engraved(ch);
    else                                     shape_flat(ch);
}

// ============================================================
//  TESTO COMPLETO
// ============================================================
module fancy_text() {
    n   = len(text_string);
    tw  = total_width(text_string);
    cws = cum_widths(text_string);

    for (i = [0 : n - 1]) {
        ch   = char_at(text_string, i);
        cw   = char_width(ch);
        xpos = cws[i] + cw / 2 - tw / 2;
        translate([xpos, 0, 0])
            render_letter(ch, i, n);
    }
}

// ============================================================
//  BASE
// ============================================================
module make_base() {
    if (base_type == "None") { /* nessuna base */ }
    else {
        tw = total_width(text_string);
        bw = tw + base_margin * 2;
        bh = letter_size + base_margin * 2;
        bz = base_height;
        r  = min(base_margin * 0.8, bz, 5);

        translate([0, 0, -bz]) {

            // ---- Rectangle ----
            if (base_type == "Rectangle") {
                translate([-bw/2, -bh/2, 0])
                    cube([bw, bh, bz]);
            }

            // ---- Rounded ----
            else if (base_type == "Rounded") {
                minkowski() {
                    translate([-bw/2 + r, -bh/2 + r, 0])
                        cube([bw - 2*r, bh - 2*r, max(0.1, bz - r)]);
                    cylinder(r = r, h = r);
                }
            }

            // ---- Frame_Rectangle ----
            else if (base_type == "Frame_Rectangle") {
                ft = frame_thickness;
                fh = frame_wall_height;
                // piatto di fondo
                translate([-bw/2, -bh/2, 0])
                    cube([bw, bh, bz]);
                // bordo
                difference() {
                    translate([-bw/2, -bh/2, bz])
                        cube([bw, bh, fh]);
                    translate([-bw/2 + ft, -bh/2 + ft, bz - 0.01])
                        cube([bw - 2*ft, bh - 2*ft, fh + 0.1]);
                }
            }

            // ---- Frame_Rounded ----
            else if (base_type == "Frame_Rounded") {
                ft = frame_thickness;
                fh = frame_wall_height;
                ri = min(r, base_margin * 0.5);
                // piatto di fondo arrotondato
                minkowski() {
                    translate([-bw/2 + r, -bh/2 + r, 0])
                        cube([bw - 2*r, bh - 2*r, max(0.1, bz - r)]);
                    cylinder(r = r, h = r);
                }
                // bordo arrotondato
                difference() {
                    translate([0, 0, bz])
                    minkowski() {
                        translate([-bw/2 + r, -bh/2 + r, 0])
                            cube([bw - 2*r, bh - 2*r, max(0.1, fh - ri)]);
                        cylinder(r = r, h = ri);
                    }
                    translate([0, 0, bz - 0.01])
                    minkowski() {
                        iw = max(0.5, bw - 2*ft);
                        ih = max(0.5, bh - 2*ft);
                        ir = max(0.5, r - ft * 0.5);
                        translate([-iw/2 + ir, -ih/2 + ir, 0])
                            cube([iw - 2*ir, ih - 2*ir, fh + 0.2]);
                        cylinder(r = ir, h = 0.01);
                    }
                }
            }
        }
    }
}

// ============================================================
//  ASSEMBLAGGIO FINALE
// ============================================================
module main() {
    tw = total_width(text_string);
    bw = tw + base_margin * 2;
    bh = letter_size + base_margin * 2;
    bz = base_height;

    union() {
        if (base_type != "None") {
            color(base_color) {
                difference() {
                    union() {
                        make_base();
                        if (add_keychain_loop) {
                            kr = keychain_hole_diameter / 2 + 3;
                            translate([-bw/2, 0, -bz])
                                cylinder(r = kr, h = max(0.1, bz));
                        }
                    }
                    if (add_keychain_loop) {
                        translate([-bw/2, 0, -bz - 0.1])
                            cylinder(r = keychain_hole_diameter / 2, h = bz + 0.2);
                    }
                }
            }
        }
        color(text_color) fancy_text();
    }
}

main();

// ============================================================
// FINE SCRIPT  —  Fancy 3D Text Generator v2.0
// ============================================================
