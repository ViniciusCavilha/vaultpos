import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { storage } from '@/firebase/config'

function fileExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || 'bin'
}

export async function uploadImagemProduto(empresaId: string, file: File): Promise<string> {
  const path = `produtos/${empresaId}/${Date.now()}.${fileExtension(file)}`
  const reference = storageRef(storage, path)
  await uploadBytes(reference, file)
  return getDownloadURL(reference)
}

export async function uploadLogoEmpresa(empresaId: string, file: File): Promise<string> {
  const path = `empresas/${empresaId}/logo.${fileExtension(file)}`
  const reference = storageRef(storage, path)
  await uploadBytes(reference, file)
  return getDownloadURL(reference)
}

export async function uploadFotoUsuario(usuarioId: string, file: File): Promise<string> {
  const path = `usuarios/${usuarioId}/foto.${fileExtension(file)}`
  const reference = storageRef(storage, path)
  await uploadBytes(reference, file)
  return getDownloadURL(reference)
}

export async function deleteFile(path: string) {
  await deleteObject(storageRef(storage, path))
}
