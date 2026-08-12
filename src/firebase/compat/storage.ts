import {
  deleteFile as deleteFirebaseFile,
  uploadFotoUsuario,
  uploadImagemProduto,
  uploadLogoEmpresa,
} from '@/firebase/storage'

export { uploadFotoUsuario, uploadImagemProduto, uploadLogoEmpresa }

export async function deleteFile(bucket: string, path: string) {
  return deleteFirebaseFile(`${bucket}/${path}`)
}
