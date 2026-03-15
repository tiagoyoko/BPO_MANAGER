/** Tipo compartilhado para metadados de documento — usado em rotas e componente UI. */
export type DocumentoItem = {
  id: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanho: number;
  createdAt: string;
  autor: string | null;
};
