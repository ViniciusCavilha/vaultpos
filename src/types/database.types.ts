// ============================================================
// ENUMs
// ============================================================

export type PlanTipo = 'basico' | 'profissional' | 'enterprise'
export type MetodoPagamento = 'pix' | 'cartao' | 'dinheiro'
export type StatusPagamento = 'pendente' | 'pago' | 'cancelado'
export type StatusComanda = 'aberta' | 'fechada' | 'cancelada'
export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste'
export type CargoUsuario = 'admin' | 'garcom'

// ============================================================
// ENTIDADES (rows do banco)
// ============================================================

export type Empresa = {
  id: string
  nome: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  logo: string | null
  plano: PlanTipo
  ativo: boolean
  criado_em: string
}

export type Configuracao = {
  id: string
  empresa_id: string
  nome_fantasia: string | null
  moeda: string
  taxa_servico: number
  tema: string
  impressora_padrao: string | null
  aceita_pix: boolean
  aceita_cartao: boolean
  aceita_dinheiro: boolean
  horario_funcionamento: Record<string, unknown> | null
  criado_em: string
}

export type Usuario = {
  id: string
  empresa_id: string
  nome: string
  email: string
  telefone: string | null
  cargo: CargoUsuario
  foto: string | null
  ativo: boolean
  ultimo_login: string | null
  criado_em: string
}

export type Cliente = {
  id: string
  empresa_id: string
  nome: string
  telefone: string | null
  observacoes: string | null
  criado_em: string
}

export type Categoria = {
  id: string
  empresa_id: string
  nome: string
  descricao: string | null
  ativo: boolean
}

export type Produto = {
  id: string
  empresa_id: string
  categoria_id: string | null
  codigo: string | null
  nome: string
  descricao: string | null
  preco: number
  custo: number
  estoque: number
  estoque_minimo: number
  unidade: string
  imagem: string | null
  ativo: boolean
  criado_em: string
}

export type Comanda = {
  id: string
  empresa_id: string
  cliente_id: string | null
  garcom_id: string | null
  mesa: number | null
  observacoes: string | null
  status: StatusComanda
  subtotal: number
  desconto: number
  taxa_servico: number
  total: number
  criada_em: string
  fechada_em: string | null
}

export type ItemComanda = {
  id: string
  comanda_id: string
  produto_id: string
  quantidade: number
  valor_unitario: number
  subtotal: number
}

export type Pagamento = {
  id: string
  empresa_id: string
  comanda_id: string
  metodo: MetodoPagamento
  valor: number
  status: StatusPagamento
  recebido_por: string | null
  data_pagamento: string
}

export type MovimentacaoEstoque = {
  id: string
  empresa_id: string
  produto_id: string
  usuario_id: string | null
  tipo: TipoMovimentacao
  quantidade: number
  motivo: string | null
  data: string
}

// ============================================================
// TIPOS COM RELAÇÕES (joins)
// ============================================================

export type ProdutoComCategoria = Produto & {
  categorias: Pick<Categoria, 'id' | 'nome'> | null
}

export type ItemComandaComProduto = ItemComanda & {
  produtos: Pick<Produto, 'id' | 'nome' | 'imagem'> | null
}

export type ComandaComRelacoes = Comanda & {
  clientes: Pick<Cliente, 'id' | 'nome' | 'telefone'> | null
  usuarios: Pick<Usuario, 'id' | 'nome'> | null
}

export type ComandaDetalhada = ComandaComRelacoes & {
  itens_comanda: ItemComandaComProduto[]
}

export type PagamentoComRelacoes = Pagamento & {
  comandas: Pick<Comanda, 'id' | 'mesa'> | null
  usuarios: Pick<Usuario, 'id' | 'nome'> | null
}

export type MovimentacaoComRelacoes = MovimentacaoEstoque & {
  produtos: Pick<Produto, 'id' | 'nome'> | null
  usuarios: Pick<Usuario, 'id' | 'nome'> | null
}

export type EmpresaComConfiguracoes = Empresa & {
  configuracoes: Configuracao | null
}

// ============================================================
// TIPOS DE INPUT (para criar/atualizar)
// ============================================================

export type CreateEmpresa = Omit<Empresa, 'id' | 'criado_em'>
export type UpdateEmpresa = Partial<Omit<Empresa, 'id' | 'criado_em'>>

export type CreateUsuario = Omit<Usuario, 'id' | 'criado_em' | 'ultimo_login'>
export type UpdateUsuario = Partial<Omit<Usuario, 'id' | 'criado_em' | 'empresa_id'>>

export type CreateCliente = Omit<Cliente, 'id' | 'criado_em'>
export type UpdateCliente = Partial<Omit<Cliente, 'id' | 'criado_em' | 'empresa_id'>>

export type CreateCategoria = Omit<Categoria, 'id'>
export type UpdateCategoria = Partial<Omit<Categoria, 'id' | 'empresa_id'>>

export type CreateProduto = Omit<Produto, 'id' | 'criado_em'>
export type UpdateProduto = Partial<Omit<Produto, 'id' | 'criado_em' | 'empresa_id'>>

export type CreateComanda =
  Pick<Comanda, 'empresa_id'> &
  Partial<Pick<Comanda, 'cliente_id' | 'garcom_id' | 'mesa' | 'observacoes' | 'status' | 'subtotal' | 'desconto' | 'taxa_servico' | 'total' | 'fechada_em'>>
export type UpdateComanda = Partial<Omit<Comanda, 'id' | 'criada_em' | 'empresa_id'>>

export type CreateItemComanda = Omit<ItemComanda, 'id' | 'subtotal'> & Partial<Pick<ItemComanda, 'subtotal'>>
export type UpdateItemComanda = Partial<Pick<ItemComanda, 'quantidade' | 'subtotal'>>

export type CreatePagamento = Omit<Pagamento, 'id' | 'data_pagamento' | 'status'> & Partial<Pick<Pagamento, 'status'>>
export type UpdatePagamento = Partial<Pick<Pagamento, 'status'>>

export type CreateMovimentacao =
  Omit<MovimentacaoEstoque, 'id' | 'data' | 'usuario_id' | 'motivo'> &
  Partial<Pick<MovimentacaoEstoque, 'usuario_id' | 'motivo'>>

export type CreateConfiguracao = Omit<Configuracao, 'id' | 'criado_em'>
export type UpdateConfiguracao = Partial<Omit<Configuracao, 'id' | 'criado_em' | 'empresa_id'>>
