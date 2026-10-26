import {
  DocumentData,
  Firestore,
  FirestoreError,
  collection,
  doc,
  getDocFromServer,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { Amistad, Persona, idPar } from "./amistades";
import { Tarjeta } from "./tarjeta";

// Lo único de F que habla con Firestore (spec F §7.2). Las acciones que deben
// confirmarse van en transacción: sin red fallan en vez de quedar en cola.

export function conPlazo<T>(p: Promise<T>, ms = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("sin-conexion")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export async function buscarCodigo(
  db: Firestore,
  codigo: string,
): Promise<Persona | null> {
  const s = await getDocFromServer(doc(db, "codigos", codigo));
  return s.exists() ? { uid: s.data().uid, nombre: s.data().nombre } : null;
}

// Los nombres salen del código y de tu tarjeta publicada, como piden las reglas.
export const enviarSolicitud = (
  db: Firestore,
  yo: string,
  otro: Persona,
  codigo: string,
) =>
  runTransaction(db, async (tx) => {
    const c = await tx.get(doc(db, "codigos", codigo));
    const mia = await tx.get(doc(db, "perfiles", yo));
    if (!c.exists() || c.data().uid !== otro.uid || !mia.exists())
      throw new Error("error");
    tx.set(doc(db, "amistades", idPar(yo, otro.uid)), {
      de: yo,
      para: otro.uid,
      miembros: [yo, otro.uid],
      estado: "pendiente",
      nombreDe: mia.data().nombre,
      nombrePara: c.data().nombre,
      codigo,
      creada: serverTimestamp(),
      aceptada: null,
    });
  });

export const aceptarSolicitud = (db: Firestore, id: string) =>
  runTransaction(db, async (tx) => {
    const a = await tx.get(doc(db, "amistades", id));
    if (!a.exists() || a.data().estado !== "pendiente")
      throw new Error("error");
    tx.update(doc(db, "amistades", id), {
      estado: "aceptada",
      aceptada: serverTimestamp(),
    });
  });

export const borrarAmistad = (db: Firestore, id: string) =>
  runTransaction(db, async (tx) => {
    tx.delete(doc(db, "amistades", id));
  });

// Un lote normal: si no hay red queda en cola y se sube después.
export function publicarTarjeta(
  db: Firestore,
  uid: string,
  t: Tarjeta,
  antes: Tarjeta | null,
) {
  const lote = writeBatch(db);
  lote.set(doc(db, "perfiles", uid), { ...t, actualizado: serverTimestamp() });
  if (antes && antes.codigo === t.codigo && antes.nombre !== t.nombre)
    lote.update(doc(db, "codigos", t.codigo), { nombre: t.nombre });
  return lote.commit();
}

// Código nuevo + tarjeta en la misma transacción (y se borra el viejo). Si el
// código ya existe, falla con «ocupado» para probar otro.
export const crearCodigo = (
  db: Firestore,
  uid: string,
  t: Tarjeta,
  viejo: string | null,
) =>
  runTransaction(db, async (tx) => {
    if ((await tx.get(doc(db, "codigos", t.codigo))).exists())
      throw new Error("ocupado");
    tx.set(doc(db, "codigos", t.codigo), { uid, nombre: t.nombre });
    tx.set(doc(db, "perfiles", uid), { ...t, actualizado: serverTimestamp() });
    if (viejo) tx.delete(doc(db, "codigos", viejo));
  });

const amistadDe = (id: string, v: DocumentData): Amistad => ({
  id,
  de: v.de,
  para: v.para,
  estado: v.estado,
  nombreDe: v.nombreDe,
  nombrePara: v.nombrePara,
  codigo: v.codigo,
});

const tarjetaDe = (v: DocumentData): Tarjeta => ({
  nombre: v.nombre,
  roles: v.roles,
  desde: v.desde,
  nivel: v.nivel,
  puntos: v.puntos,
  logros: v.logros,
  areas: v.areas,
  codigo: v.codigo,
});

export const escucharAmistades = (
  db: Firestore,
  uid: string,
  cb: (a: Amistad[]) => void,
  error: (e: FirestoreError) => void,
) =>
  onSnapshot(
    query(
      collection(db, "amistades"),
      where("miembros", "array-contains", uid),
    ),
    (s) => cb(s.docs.map((d) => amistadDe(d.id, d.data()))),
    error,
  );

// `servidor`: la respuesta viene de Firebase y no del caché del teléfono. Solo
// con eso se decide que una cuenta todavía no tiene tarjeta ni código.
export const escucharTarjeta = (
  db: Firestore,
  uid: string,
  cb: (t: Tarjeta | null, servidor: boolean) => void,
  error: (e: FirestoreError) => void,
) =>
  onSnapshot(
    doc(db, "perfiles", uid),
    (s) => cb(s.exists() ? tarjetaDe(s.data()) : null, !s.metadata.fromCache),
    error,
  );
