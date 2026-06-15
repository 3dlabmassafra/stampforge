/*
 * ╔══════════════════════════════════════════════════════════╗
 * ║   🍪 Tagliabiscotti Lettere - Stile Luban 3D           ║
 * ║   Cookie Cutter Letters - Luban 3D Style                ║
 * ║   Fully Customizable - MakerWorld Ready                 ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 *  STRUTTURA A 3 LIVELLI (come Luban 3D):
 *
 *         ┌─┐                   ┌─┐
 *         │ │   LAMA (blade)    │ │   ← sottilissima, taglia
 *     ┌───┘ └───────────────────┘ └───┐
 *     │     CORPO (middle)            │   ← parete media
 *  ┌──┘                              └──┐
 *  │        BASE (base/grip)             │   ← larga, per premere
 *  └─────────────────────────────────────┘
 *
 *  La CORNICE segue il profilo delle lettere e le collega
 *  tutte in un unico pezzo solido.
 *
 *  License: CC BY-SA 4.0
 */

// ═══════════════════════════════════════════
//   PARAMETRI / PARAMETERS
// ═══════════════════════════════════════════

/* [📝 Testo / Text] */

// Testo del tagliabiscotti
Custom_Text = "Your Text";

// Font (corsivo consigliato)
Font_Name = "Segoe Script"; // [Segoe Script,Lucida Handwriting,Brush Script MT,Comic Sans MS,Liberation Sans,Arial]

// Stile font
Font_Style = "Bold"; // [Regular,Bold,Italic,Bold Italic]

// Dimensione lettere mm
Font_Size = 50; // [15:1:150]

// Spazio tra lettere mm
Letter_Gap = 3; // [0:0.5:20]


/* [🔪 Lama / Blade (cuts dough)] */

// Larghezza lama mm
Blade_Width = 0.5; // [0.3:0.1:1.5]

// Altezza lama mm
Blade_Height = 1.0; // [0.5:0.5:4]


/* [🧱 Corpo / Middle (main wall)] */

// Larghezza corpo mm
Middle_Width = 2.0; // [1.0:0.1:5.0]

// Altezza corpo mm
Middle_Height = 10; // [4:0.5:25]


/* [🖐️ Base / Base (top grip)] */

// Larghezza base mm
Base_Width = 4.0; // [2.0:0.5:10]

// Altezza base mm
Base_Height = 4.0; // [2:0.5:10]


/* [🔲 Contorno / Outline Frame] */

// Distanza contorno dalle lettere mm (offset)
Frame_Offset = 5; // [2:0.5:20]

// Arrotondamento contorno mm
Frame_Round = 3; // [0:1:20]


/* [🔗 Ponticelli isole / Island Bridges] */

// Abilita ponticelli per lettere chiuse (A,B,O,R...)
Enable_Bridges = true;

// Larghezza ponticelli mm
Bridge_Width = 1.0; // [0.4:0.1:2.5]


/* [✋ Stopper / Embossing] */

// Abilita stopper (stampa dettaglio nella pasta)
Enable_Stopper = true;

// Profondita' stopper mm
Stopper_Depth = 3; // [1:0.5:10]

// Spessore pareti stopper mm
Stopper_Wall = 1.0; // [0.6:0.1:2.5]


/* [📐 Vista / View] */

// Vista
Show = "Tutto"; // [Tutto,Lettera singola]

// Indice lettera singola
Single_Index = 1; // [1:1:80]


/* [Hidden] */
$fn = 72;


// ═══════════════════════════════════════════
//   CALCOLI INTERNI
// ═══════════════════════════════════════════

_font    = str(Font_Name, ":style=", Font_Style);
_tlen    = len(Custom_Text);
_z_blade = 0;
_z_mid   = Blade_Height;
_z_base  = Blade_Height + Middle_Height;
_total_h = Blade_Height + Middle_Height + Base_Height;

function _cw(c) =
    (c == " ")                                      ? Font_Size * 0.38 :
    (c == "I" || c == "l" || c == "1" || c == "i") ? Font_Size * 0.38 :
    (c == "m" || c == "M" || c == "W" || c == "w") ? Font_Size * 0.92 :
    (c == "f" || c == "r" || c == "t" || c == "j") ? Font_Size * 0.48 :
    Font_Size * 0.64;

function _cx(i) = (i <= 0) ? 0 :
    _cx(i-1) + _cw(Custom_Text[i-1]) + Letter_Gap;


// ═══════════════════════════════════════════
//   2D — SINGOLO CARATTERE
// ═══════════════════════════════════════════

module _char(c) {
    text(c, size = Font_Size, font = _font,
         halign = "center", valign = "baseline");
}

module char_shell_2d(c, w) {
    difference() {
        offset(delta = w) _char(c);
        _char(c);
    }
}

module char_bridges_2d(c) {
    bbox = Font_Size * 1.8;
    intersection() {
        offset(delta = Middle_Width * 0.4) _char(c);
        union() {
            translate([-bbox/2, -Bridge_Width/2])
                square([bbox, Bridge_Width]);
            translate([-Bridge_Width/2, -bbox/2])
                square([Bridge_Width, bbox]);
        }
    }
}

module char_stopper_2d(c) {
    difference() {
        offset(delta = Stopper_Wall) _char(c);
        _char(c);
    }
}


// ═══════════════════════════════════════════
//   2D — TUTTE LE LETTERE + CONTORNO
// ═══════════════════════════════════════════

// Unione di tutte le lettere piene (base per l'offset del contorno)
module _all_chars_raw() {
    for (i = [0 : _tlen - 1]) {
        c = Custom_Text[i];
        if (c != " ")
            translate([_cx(i), 0]) _char(c);
    }
}

// Contorno che SEGUE il profilo delle lettere con offset
// e si COLLEGA alle pareti delle lettere (stessa larghezza)
module frame_shell_2d(wall_w) {
    difference() {
        offset(r = Frame_Round)
            offset(delta = Frame_Offset + wall_w)
                _all_chars_raw();
        offset(r = Frame_Round)
            offset(delta = Frame_Offset)
                _all_chars_raw();
    }
}

// Shell di tutte le lettere ad una data larghezza
module all_chars_shell_2d(w) {
    for (i = [0 : _tlen - 1]) {
        c = Custom_Text[i];
        if (c != " ")
            translate([_cx(i), 0])
                char_shell_2d(c, w);
    }
}


// ═══════════════════════════════════════════
//   3D — LETTERE
// ═══════════════════════════════════════════

module all_letters_3d() {
    for (i = [0 : _tlen - 1]) {
        c = Custom_Text[i];
        if (c != " ") {
            translate([_cx(i), 0, 0]) {
                // LAMA
                translate([0, 0, _z_blade])
                    linear_extrude(height = Blade_Height)
                        char_shell_2d(c, Blade_Width);
                // CORPO
                translate([0, 0, _z_mid])
                    linear_extrude(height = Middle_Height)
                        char_shell_2d(c, Middle_Width);
                // BASE
                translate([0, 0, _z_base])
                    linear_extrude(height = Base_Height)
                        char_shell_2d(c, Base_Width);
                // PONTICELLI (solo nella base, in alto)
                if (Enable_Bridges)
                    translate([0, 0, _z_base])
                        linear_extrude(height = Base_Height)
                            char_bridges_2d(c);
                // STOPPER
                if (Enable_Stopper)
                    translate([0, 0, _z_base])
                        linear_extrude(height = Stopper_Depth)
                            char_stopper_2d(c);
            }
        }
    }
}


// ═══════════════════════════════════════════
//   3D — CONTORNO CHE SEGUE LE LETTERE
// ═══════════════════════════════════════════

module frame_3d() {
    // LAMA del contorno
    translate([0, 0, _z_blade])
        linear_extrude(height = Blade_Height)
            frame_shell_2d(Blade_Width);

    // CORPO del contorno
    translate([0, 0, _z_mid])
        linear_extrude(height = Middle_Height)
            frame_shell_2d(Middle_Width);

    // BASE del contorno
    translate([0, 0, _z_base])
        linear_extrude(height = Base_Height)
            frame_shell_2d(Base_Width);
}


// ═══════════════════════════════════════════
//   ASSEMBLAGGIO
// ═══════════════════════════════════════════

module full_cutter() {
    union() {
        all_letters_3d();
        frame_3d();
    }
}

module show_single() {
    idx = max(0, min(Single_Index - 1, _tlen - 1));
    c = Custom_Text[idx];
    if (c != " ") {
        // LAMA
        linear_extrude(height = Blade_Height)
            char_shell_2d(c, Blade_Width);
        // CORPO
        translate([0,0,_z_mid])
            linear_extrude(height = Middle_Height)
                char_shell_2d(c, Middle_Width);
        // BASE
        translate([0,0,_z_base])
            linear_extrude(height = Base_Height)
                char_shell_2d(c, Base_Width);
        if (Enable_Bridges)
            translate([0,0,_z_base])
                linear_extrude(height = Base_Height)
                    char_bridges_2d(c);
        if (Enable_Stopper)
            translate([0,0,_z_base])
                linear_extrude(height = Stopper_Depth)
                    char_stopper_2d(c);
    }
}


// ═══════════════════════════════════════════
//   ENTRY POINT
// ═══════════════════════════════════════════

if (Show == "Lettera singola")
    show_single();
else
    full_cutter();
