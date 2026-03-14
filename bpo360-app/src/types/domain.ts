/**
 * Tipos de domínio BPO360.
 * Story 8.1: CurrentUser e PapelBpo para auth e RBAC.
 */

export type PapelBpo =
  | "admin_bpo"
  | "gestor_bpo"
  | "operador_bpo"
  | "cliente_final";

export type CurrentUser = {
  id: string;
  email: string | null;
  bpoId: string;
  role: PapelBpo;
  clienteId: string | null;
  nome: string | null;
};
