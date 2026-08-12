import { toastController } from '@ionic/vue'
import {
  alertCircle,
  checkmarkCircle,
  informationCircle,
  warning,
} from 'ionicons/icons'

export type VaultToastType = 'success' | 'error' | 'warning' | 'info'

export function useVaultToast() {
  async function showToast(
    message: string,
    type: VaultToastType = 'info',
    duration = 3000,
  ) {
    const icons = {
      success: checkmarkCircle,
      error: alertCircle,
      warning,
      info: informationCircle,
    }

    const toast = await toastController.create({
      message,
      duration,
      position: 'top',
      icon: icons[type],
      cssClass: `vault-toast vault-toast-${type}`,
    })

    await toast.present()
  }

  return { showToast }
}
