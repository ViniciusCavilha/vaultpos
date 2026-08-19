import {
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase/config'

const categories = [
  { id: 'bebidas', nome: 'Bebidas' },
  { id: 'porcoes', nome: 'Porções' },
  { id: 'pratos', nome: 'Pratos' },
  { id: 'sobremesas', nome: 'Sobremesas' },
]

const products = [
  {
    id: 'cerveja-artesanal',
    nome: 'Cerveja Artesanal',
    categoriaId: 'bebidas',
    preco: 18.9,
    estoque: 45,
    estoqueMinimo: 10,
  },
  {
    id: 'refrigerante-lata',
    nome: 'Refrigerante Lata',
    categoriaId: 'bebidas',
    preco: 8,
    estoque: 80,
    estoqueMinimo: 20,
  },
  {
    id: 'batata-frita',
    nome: 'Porção de Batata Frita',
    categoriaId: 'porcoes',
    preco: 32,
    estoque: 20,
    estoqueMinimo: 5,
  },
  {
    id: 'calabresa-acebolada',
    nome: 'Calabresa Acebolada',
    categoriaId: 'porcoes',
    preco: 28,
    estoque: 15,
    estoqueMinimo: 5,
  },
  {
    id: 'file-molho-madeira',
    nome: 'Filé ao Molho Madeira',
    categoriaId: 'pratos',
    preco: 58,
    estoque: 12,
    estoqueMinimo: 3,
  },
  {
    id: 'picanha-chapa',
    nome: 'Picanha na Chapa',
    categoriaId: 'pratos',
    preco: 72,
    estoque: 8,
    estoqueMinimo: 2,
  },
  {
    id: 'pudim-leite',
    nome: 'Pudim de Leite',
    categoriaId: 'sobremesas',
    preco: 16,
    estoque: 0,
    estoqueMinimo: 4,
  },
  {
    id: 'caipirinha',
    nome: 'Caipirinha',
    categoriaId: 'bebidas',
    preco: 22,
    estoque: 3,
    estoqueMinimo: 5,
  },
]

export async function seedDatabase(empresaId: string): Promise<void> {
  if (!empresaId.trim()) throw new Error('Informe um ID de empresa válido.')

  await Promise.all([
    setDoc(
      doc(db, 'empresas', empresaId),
      {
        nome: 'Bar do Zé',
        cnpj: '12.345.678/0001-99',
        telefone: '(47) 99999-0001',
        email: 'contato@bardoze.com.br',
        endereco: null,
        logo: null,
        plano: 'profissional',
        ativo: true,
        criadoEm: serverTimestamp(),
      },
      { merge: true },
    ),
    setDoc(
      doc(db, 'empresas', empresaId, 'configuracoes', 'config'),
      {
        nomeFantasia: 'Bar do Zé',
        moeda: 'BRL',
        taxaServico: 10,
        tema: 'light',
        aceitaPix: true,
        aceitaCartao: true,
        aceitaDinheiro: true,
        criadoEm: serverTimestamp(),
      },
      { merge: true },
    ),
  ])

  const batch = writeBatch(db)

  for (const category of categories) {
    batch.set(
      doc(db, 'empresas', empresaId, 'categorias', category.id),
      {
        empresaId,
        nome: category.nome,
        descricao: null,
        ativo: true,
      },
      { merge: true },
    )
  }

  for (const product of products) {
    batch.set(
      doc(db, 'empresas', empresaId, 'produtos', product.id),
      {
        ...product,
        empresaId,
        codigo: null,
        descricao: null,
        custo: product.preco * 0.4,
        unidade: 'un',
        imagem: null,
        ativo: true,
        criadoEm: serverTimestamp(),
      },
      { merge: true },
    )
  }

  batch.set(
    doc(db, 'empresas', empresaId, 'usuarios', 'admin-demo'),
    {
      empresaId,
      nome: 'Administrador VaultPOS',
      email: 'admin@vaultpos.com',
      telefone: null,
      cargo: 'admin',
      foto: null,
      ativo: true,
      ultimoLogin: null,
      criadoEm: serverTimestamp(),
    },
    { merge: true },
  )

  batch.set(
    doc(db, 'empresas', empresaId, 'usuarios', 'garcom-demo'),
    {
      empresaId,
      nome: 'Carlos',
      email: 'garcom@vaultpos.com',
      telefone: '(11) 98765-4321',
      cargo: 'garcom',
      foto: null,
      ativo: true,
      ultimoLogin: null,
      criadoEm: serverTimestamp(),
    },
    { merge: true },
  )

  await batch.commit()
  localStorage.setItem('vaultpos:empresaId', empresaId)
}
