"""Genera DOCUMENTOS/V2/MEGA_MAQUETA/mega-maqueta-v2.html (14/11/2026).

Parte de mega-maqueta.html (la original NO se toca) y le suma lo de H3: las
maquetas aprobadas H_MAQUETA/05 (conectar cuentas, cuentas conectadas, calendario
en espejo, correo con Neka) y la propuesta H_MAQUETA/04 B (tutorial guiado).
Los textos salen de DOCUMENTOS/V2/H3_CONEXIONES.md y del manifiesto de H_MAQUETA.
Uso: python mega_v2.py
"""
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
V2 = os.path.join(ROOT, "DOCUMENTOS", "V2")
SRC = os.path.join(V2, "MEGA_MAQUETA", "mega-maqueta.html")
OUT = os.path.join(V2, "MEGA_MAQUETA", "mega-maqueta-v2.html")
M05 = os.path.join(V2, "H_MAQUETA", "05-conexiones-correo-calendario.html")
M04 = os.path.join(V2, "H_MAQUETA", "04-primer-uso-conectar-y-tutorial.html")


def rd(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def rules(css):
    out, depth, cur = [], 0, ""
    for ch in css:
        cur += ch
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                out.append(cur.strip())
                cur = ""
    return out


def style_blocks(t):
    return re.findall(r"<style>(.*?)</style>", t, re.S)[1:]  # el 1.º es el body de la maqueta suelta


def body_of(t):
    """Lo que hay después del último </style> y antes del <script>."""
    t = t[t.rindex("</style>") + len("</style>"):]
    return t[: t.index("<script>")].strip()


def must_replace(t, old, new, count=1):
    if old not in t:
        sys.exit("NO ENCONTRÉ: " + old[:90])
    return t.replace(old, new, count)


mega = rd(SRC)
m05, m04 = rd(M05), rd(M04)

# ---------- CSS nuevo (solo reglas que la mega no tiene; no hay conflictos de selector) ----------
have = set(rules("".join(re.findall(r"<style>(.*?)</style>", mega, re.S))))
nuevo = []
for t in (m05, m04):
    for b in style_blocks(t):
        for r in rules(b):
            if r not in have and r not in nuevo:
                nuevo.append(r)
nuevo.append(".mm-new{border-style:dashed;border-color:#7546EC}")
nuevo.append(".mm-state{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 4px}")
css_extra = "\n".join(nuevo)

# ---------- cuerpos de las maquetas ----------
b05 = body_of(m05)
b05 = re.sub(r"<h2>.*?</h2>\s*", "", b05, count=1, flags=re.S)
b05 = re.sub(r'<p class="subtitle">.*?</p>\s*', "", b05, count=1, flags=re.S)
b05 = b05.replace('<h3>A · Al crear la cuenta</h3>', '<h3 class="mm-grp">A · Al crear la cuenta</h3>')
b05 = b05.replace('<h3 style="margin-top:34px">', '<h3 class="mm-grp" style="margin-top:34px">')

b04 = body_of(m04)
i = b04.index("<h3 style=\"margin-top:34px\">B · El tutorial</h3>")
b04 = b04[i:].replace('<h3 style="margin-top:34px">B · El tutorial</h3>', '<h3 class="mm-grp">E · Tutorial guiado</h3>')

SECCION = f"""<section id="conexiones"><div class="mm-wrap">
 <p class="mm-kicker">3b · Nuevo desde el 13 de noviembre</p><h2>Conexiones con Google y Outlook</h2>
 <p class="mm-lead">Nekal se conectará, con tu permiso, a <b>Gmail + Google Calendar</b> y a <b>Outlook Mail + Outlook Calendar</b>. Trae tu calendario y lo mantiene en espejo, y deja que Neka te diga qué correos importan y escriba borradores. Esta parte <b>está aprobada en maqueta y todavía no se construye</b>: es lo que viene (fases H3 a H5).</p>
 <div class="mm-state"><span class="mm-tag t-pend">Maqueta 05 aprobada · 13/11/2026</span><span class="mm-tag t-pend">Sin construir</span><span class="mm-tag t-off">Correo «solo lo importante»: propuesta v2</span><span class="mm-tag t-off">Tutorial guiado: sin aprobar</span></div>
 <div class="mm-two" style="margin-top:16px">
  <div class="mm-box"><h3>Lo que decidiste (12 y 13/11)</h3><ul class="mm-ul "><li><b>Sin servidor ni plan Blaze:</b> la app pide el permiso y habla directo con Google y Microsoft.</li><li><b>Web instalada como app</b> («Agregar a inicio»); la app nativa se ve al terminar. Expo Go queda para desarrollo.</li><li><b>Calendario en espejo completo:</b> lo que creas, editas, mueves o borras cambia en los dos lados. Lo que creas en Nekal con hora se copia a un calendario «Nekal» en la cuenta que elijas.</li><li><b>Correo con Neka:</b> Neka destaca lo que pide algo, y tú abres, lees y respondes con un borrador suyo. Nada se envía sin tocar «Enviar».</li><li><b>Neka y lo externo:</b> los eventos de afuera son fijos por defecto; solo los mueve si se lo pides y siempre ves la propuesta antes de aceptar.</li><li><b>Al crear la cuenta</b> lo primero es «Conecta tus cuentas». El tutorial queda para después.</li></ul></div>
  <div class="mm-box"><h3>Qué cambia en la app</h3><ul class="mm-ul "><li>La pestaña <b>Chat pasa a llamarse IA</b> (ícono de destellos) y tiene <b>Chat | Correo</b>.</li><li>Ajustes suma <b>Cuentas conectadas</b> (no «Conexiones», que en el código significa dependencias).</li><li>Agenda, Mes, círculo y detalle muestran un <b>ícono de origen</b> en los eventos de Google u Outlook.</li><li>Las clases que ya pasaron, traídas de afuera, <b>no cuentan como atrasadas</b>.</li><li>No se guarda ningún correo ni ningún pase en la nube: viven solo en el dispositivo.</li><li><b>Fuera de alcance por ahora:</b> sincronizar con la app cerrada, adjuntos, redactar correos nuevos desde cero y copiar rutinas.</li></ul></div>
 </div>
 <p class="mm-lead" style="margin-top:18px">Los datos son de ejemplo y coherentes entre las pantallas: hoy es jueves 12 de noviembre. Los cuadros A a D son la maqueta 05; el E es la propuesta del tutorial (maqueta 04).</p>
 {b05}
 {b04}
 <div class="mm-two" style="margin-top:26px">
  <div class="mm-box"><h3>Qué le pide esto al sistema visual</h3><ul class="mm-ul "><li>Dos colores nuevos para el aviso ámbar «Permiso vencido»: fondo <code>#FFF4DF</code> y texto <code>#8A5A00</code> (el aviso de hoy, <code>#E8962E</code>, no sirve como texto sobre claro).</li><li>Una fila de cuenta (logo, correo, estado), una insignia de origen (Google u Outlook) y un tutorial con foco iluminado.</li><li>Ninguno existe aún en el código; se suman a <code>theme.ts</code> al construir H3.</li></ul></div>
  <div class="mm-box"><h3>Orden de construcción</h3><ul class="mm-ul "><li><b>H3</b> · Conectar cuentas (Google y Outlook).</li><li><b>H4</b> · Calendario en espejo.</li><li><b>H5</b> · Correo con Neka.</li><li><b>H6</b> · Cierre (antes llamado H5).</li></ul><p style="margin-top:8px">Spec completa: <code>DOCUMENTOS/V2/H3_CONEXIONES.md</code>.</p></div>
 </div>
</div></section>

"""

# ---------- ediciones sobre la mega original ----------
t = mega
t = must_replace(t, "<title>Nekal · Mega maqueta V2</title>", "<title>Nekal · Mega maqueta V2 · 14/11</title>")
t = must_replace(t, "</style></head><body>", css_extra + "\n</style></head><body>")
t = must_replace(t, '<a href="#flujos">Flujos importantes</a>', '<a href="#flujos">Flujos importantes</a><a href="#conexiones">Conexiones (nuevo)</a>')
t = must_replace(t, "Mega maqueta · 2 de noviembre de 2026", "Mega maqueta · actualizada el 14 de noviembre de 2026 (la original es del 2 de noviembre)")
t = must_replace(t, '<span class="mm-pill">6 flujos importantes</span>', '<span class="mm-pill">6 flujos importantes</span><span class="mm-pill">Nuevo: conexiones (en diseño)</span>')

# mapa de navegación
t = must_replace(t, '<div class="mm-node "><b>Bienvenida</b><small>Entrar · Crear cuenta · Invitado</small></div><span class="mm-ma">→</span>',
                 '<div class="mm-node "><b>Bienvenida</b><small>Entrar · Crear cuenta · Invitado</small></div><span class="mm-ma">→</span><div class="mm-node mm-new"><b>Conecta tus cuentas</b><small>una vez, al crear la cuenta · nuevo</small></div><span class="mm-ma">→</span>')
t = must_replace(t, '<div class="mm-node "><b>Plan de Neka</b><small>hoja: Aceptar · Descartar</small></div></div>',
                 '<div class="mm-node "><b>Plan de Neka</b><small>hoja: Aceptar · Descartar</small></div><div class="mm-node mm-new"><b>Correo</b><small>la pestaña pasa a «IA»: Chat | Correo · nuevo</small></div></div>')
t = must_replace(t, '<div class="mm-node "><b>Ajustes</b><small>hoja: cuenta, Neka, jornada, datos</small></div>',
                 '<div class="mm-node "><b>Ajustes</b><small>hoja: cuenta, Neka, jornada, datos</small></div><div class="mm-node mm-new"><b>Cuentas conectadas</b><small>Google y Outlook · nuevo</small></div>')

# nueva sección antes de los flujos secundarios
t = must_replace(t, '<section id="secundarios">', SECCION + '<section id="secundarios">')

# glosario
t = must_replace(t, '<div class="mm-gl"><b>Racha</b><span>Días seguidos con al menos la mitad de tu día completado.</span></div>',
                 '<div class="mm-gl"><b>Racha</b><span>Días seguidos con al menos la mitad de tu día completado.</span></div>'
                 '<div class="mm-gl"><b>Cuenta conectada <i>(en diseño)</i></b><span>Tu cuenta de Google o de Outlook que Nekal usa para traer tu calendario y tu correo.</span></div>'
                 '<div class="mm-gl"><b>Espejo <i>(en diseño)</i></b><span>Lo que cambias en Nekal cambia en tu calendario de Google u Outlook, y al revés.</span></div>'
                 '<div class="mm-gl"><b>Calendario «Nekal» <i>(en diseño)</i></b><span>Donde se copia lo que creas en Nekal con hora, en la cuenta que elijas.</span></div>')

# color nuevo en el sistema visual
t = must_replace(t, '<h3 style="margin:30px 0 12px">Componentes</h3>',
                 '<h3 style="margin:30px 0 12px">Colores propuestos para las conexiones <span class="mm-tag t-pend">aún no en el código</span></h3>'
                 '<div class="mm-sws"><div class="mm-sw"><span style="background:#FFF4DF;border:1px solid #EEE9F6"></span><b>Aviso suave</b><code>#FFF4DF</code><small>Fondo de «Permiso vencido»</small></div>'
                 '<div class="mm-sw"><span style="background:#8A5A00;"></span><b>Aviso, texto</b><code>#8A5A00</code><small>Texto sobre el aviso suave</small></div></div>'
                 '<h3 style="margin:30px 0 12px">Componentes</h3>')

# estado del proyecto
t = must_replace(t, '<tr><td><b>H3–H4</b></td><td>Google Calendar</td><td><span class="mm-tag t-pend">Pendiente</span></td><td>Siguiente en el plan.</td></tr><tr><td><b>H5</b></td><td>Cierre</td><td><span class="mm-tag t-pend">Pendiente</span></td><td>Estabilizar y preparar la entrega.</td></tr>',
                 '<tr><td><b>H3</b></td><td>Conectar cuentas (Google y Outlook)</td><td><span class="mm-tag t-pend">Maqueta aprobada · sin construir</span></td><td>«Conecta tus cuentas» al crear la cuenta y Ajustes → Cuentas conectadas. Spec del 12/11, maqueta 05 aprobada el 13/11.</td></tr>'
                 '<tr><td><b>H4</b></td><td>Calendario en espejo</td><td><span class="mm-tag t-pend">Maqueta aprobada · sin construir</span></td><td>Eventos de afuera en Agenda y Mes con su ícono de origen; lo creado en Nekal se copia afuera.</td></tr>'
                 '<tr><td><b>H5</b></td><td>Correo con Neka</td><td><span class="mm-tag t-pend">Maqueta en propuesta v2 · sin construir</span></td><td>Pestaña IA con Chat | Correo: solo lo importante, correo abierto y responder con Neka. «Solo lo importante» queda en propuesta v2.</td></tr>'
                 '<tr><td><b>—</b></td><td>Tutorial guiado</td><td><span class="mm-tag t-off">Propuesta sin aprobar</span></td><td>Seis pasos con la app oscurecida; maqueta H_MAQUETA/04. Fuera de la etapa de conexiones.</td></tr>'
                 '<tr><td><b>H6</b></td><td>Cierre</td><td><span class="mm-tag t-pend">Pendiente</span></td><td>Estabilizar y preparar la entrega (antes llamado H5).</td></tr>')
t = must_replace(t, "<li>Outlook Calendar.</li>", "")

# línea de tiempo
t = must_replace(t, '<div class="mm-tl"><b>2/11</b><span>H2 · vistas simples</span></div>',
                 '<div class="mm-tl"><b>2/11</b><span>H2 · vistas simples</span></div><div class="mm-tl"><b>12–13/11</b><span>H3 · conexiones: spec y maqueta aprobada</span></div><div class="mm-tl"><b>14/11</b><span>Sistema de diseño ordenado</span></div>')

# script de los tutoriales (posiciona el foco iluminado)
script = m05[m05.index("<script>"): m05.index("</script>") + len("</script>")]
t = must_replace(t, "<script>\naddEventListener(\"message\"", script + "\n<script>\naddEventListener(\"message\"")

with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write(t)
print("ok", len(t), "bytes;", len(nuevo), "reglas CSS nuevas")
