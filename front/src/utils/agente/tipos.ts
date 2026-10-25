// Lo que Neka necesita de una IA, sin depender de ningún proveedor (spec D §9).
// `cerebro.ts` lo cumple con Gemini; las pruebas, con un cerebro falso.
export type AudioGrabado = { base64: string; mime: string };
export type Llamada = { nombre: string; args: Record<string, unknown> };
export type Respuesta = { texto: string; llamadas: Llamada[] };
export type Resultado = { nombre: string; respuesta: Record<string, unknown> };
export type Turno = { deUsuario: boolean; texto: string };
export type Declaracion = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};
export interface Sesion {
  enviar(texto: string): Promise<Respuesta>;
  devolver(resultados: Resultado[]): Promise<Respuesta>;
}
export interface Cerebro {
  transcribir(audio: AudioGrabado): Promise<string>;
  sesion(
    instrucciones: string,
    historial: Turno[],
    herramientas: Declaracion[],
  ): Sesion;
}
