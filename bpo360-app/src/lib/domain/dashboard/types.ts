export type ResumoDashboard = {
  totalClientes: number;
  clientesPorStatus: {
    ativo: number;
    emImplantacao: number;
    pausado: number;
    encerrado: number;
  };
  clientesPorErpStatus: {
    naoConfigurado: number;
    configBasicaSalva: number;
    integracaoAtiva: number;
  };
};
