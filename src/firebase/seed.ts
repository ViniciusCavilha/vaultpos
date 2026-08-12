import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { createUsuario } from '@/firebase/collections/usuarios'

export async function seedDatabase(empresaId: string) {
  const currentUser = auth.currentUser
  if (!currentUser?.email) throw new Error('Faça login antes de popular o banco.')
  if (currentUser.uid !== empresaId) throw new Error('Use o UID do usuário autenticado como empresaId.')

  await setDoc(doc(db, 'empresas', empresaId), {
    nome: 'Bar do Zé',
    cnpj: '12.345.678/0001-99',
    telefone: '(47) 99999-0001',
    email: 'contato@bardoze.com.br',
    plano: 'profissional',
    ativo: true,
    criadoEm: serverTimestamp(),
  })

  await createUsuario(empresaId, {
    id: currentUser.uid,
    nome: currentUser.displayName || 'Administrador',
    email: currentUser.email,
    cargo: 'admin',
    foto: currentUser.photoURL,
  })

  await setDoc(doc(db, 'empresas', empresaId, 'configuracoes', 'config'), {
    nomeFantasia: 'Bar do Zé',
    moeda: 'BRL',
    taxaServico: 10,
    tema: 'light',
    aceitaPix: true,
    aceitaCartao: true,
    aceitaDinheiro: true,
    criadoEm: serverTimestamp(),
  })

  const categoryNames = ['Bebidas', 'Porções', 'Pratos', 'Sobremesas']
  const categoryIds: string[] = []
  for (const nome of categoryNames) {
    const reference = await addDoc(collection(db, 'empresas', empresaId, 'categorias'), {
      nome,
      ativo: true,
      empresaId,
    })
    categoryIds.push(reference.id)
  }

  const products = [
    { nome: 'Cerveja Artesanal', categoriaId: categoryIds[0], preco: 18.90, estoque: 45, estoqueMinimo: 10 },
    { nome: 'Refrigerante Lata', categoriaId: categoryIds[0], preco: 8, estoque: 80, estoqueMinimo: 20 },
    { nome: 'Porção de Batata Frita', categoriaId: categoryIds[1], preco: 32, estoque: 20, estoqueMinimo: 5 },
    { nome: 'Calabresa Acebolada', categoriaId: categoryIds[1], preco: 28, estoque: 15, estoqueMinimo: 5 },
    { nome: 'Filé ao Molho Madeira', categoriaId: categoryIds[2], preco: 58, estoque: 12, estoqueMinimo: 3 },
    { nome: 'Picanha na Chapa', categoriaId: categoryIds[2], preco: 72, estoque: 8, estoqueMinimo: 2 },
    { nome: 'Pudim de Leite', categoriaId: categoryIds[3], preco: 16, estoque: 0, estoqueMinimo: 4 },
    { nome: 'Caipirinha', categoriaId: categoryIds[0], preco: 22, estoque: 3, estoqueMinimo: 5 },
  ]

  for (const product of products) {
    await addDoc(collection(db, 'empresas', empresaId, 'produtos'), {
      ...product,
      empresaId,
      ativo: true,
      unidade: 'un',
      custo: product.preco * 0.4,
      criadoEm: serverTimestamp(),
    })
  }

  console.info('Dados do VaultPOS populados com sucesso.')
}
