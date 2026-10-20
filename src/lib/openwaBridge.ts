export interface OpenWaSupportRequest {
  phone: string;
  message: string;
  recipientLabel?: string;
  originalWhatsappUrl?: string;
  autoDispatchedReceipt?: {
    messageId: string;
    session: string;
    phone: string;
    operation: string;
    timestamp: string;
  } | null;
}

export type ScopeBridgeSupportRequest = OpenWaSupportRequest;

type OpenWaModalListener = (req: OpenWaSupportRequest | null) => void;
const modalListeners = new Set<OpenWaModalListener>();

export function subscribeToOpenWaModal(listener: OpenWaModalListener): () => void {
  modalListeners.add(listener);
  return () => {
    modalListeners.delete(listener);
  };
}

export const subscribeToScopeBridgeModal = subscribeToOpenWaModal;

export function closeOpenWaSupportModal(): void {
  modalListeners.forEach((l) => l(null));
}

export const closeScopeBridgeSupportModal = closeOpenWaSupportModal;

export async function dispatchOpenWaApiMessage(params: {
  phone: string;
  message?: string;
  operation?: 'send-text' | 'send-image' | 'send-document' | 'send-location';
  session?: string;
  apiKey?: string;
  imageUrl?: string;
  documentUrl?: string;
  filename?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  title?: string;
}) {
  const cleanPhone = (params.phone || '27694977018').replace(/[^\d]/g, '') || '27694977018';
  const operation = params.operation || 'send-text';
  const session = params.session || 'default';
  const apiKey = params.apiKey || 'dev-admin-key';

  const res = await fetch(`/api/openwa/messages/${operation}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      session,
      phone: cleanPhone,
      message: params.message || 'Hello Scope Bridge Support (+27 69 497 7018)!',
      caption: params.caption || params.message || 'Scope Bridge Support',
      imageUrl: params.imageUrl,
      documentUrl: params.documentUrl,
      filename: params.filename,
      latitude: params.latitude,
      longitude: params.longitude,
      title: params.title,
    }),
  });

  return res.json();
}

export const dispatchScopeBridgeApiMessage = dispatchOpenWaApiMessage;

export async function openOpenWaSupportChat(params: {
  phone?: string;
  message?: string;
  recipientLabel?: string;
  originalWhatsappUrl?: string;
  autoSend?: boolean;
}): Promise<void> {
  const cleanPhone = (params.phone || '27694977018').replace(/[^\d]/g, '') || '27694977018';
  const defaultMsg =
    params.message ||
    'Hi Scope Bridge Support (+27 69 497 7018), I need assistance.';

  let autoReceipt: OpenWaSupportRequest['autoDispatchedReceipt'] = null;

  if (params.autoSend !== false) {
    try {
      const data = await dispatchOpenWaApiMessage({
        phone: cleanPhone,
        message: defaultMsg,
        operation: 'send-text',
      });
      if (data && data.openWaReceipt) {
        autoReceipt = {
          messageId: data.openWaReceipt.messageId,
          session: data.openWaReceipt.session || 'default',
          phone: data.openWaReceipt.phone || cleanPhone,
          operation: data.openWaReceipt.operation || 'send-text',
          timestamp: new Date().toISOString(),
        };
      }
    } catch {
      // Fallback handled in UI
    }
  }

  const reqPayload: OpenWaSupportRequest = {
    phone: cleanPhone,
    message: defaultMsg,
    recipientLabel:
      params.recipientLabel ||
      (cleanPhone.includes('27694977018')
        ? 'Scope Bridge Support (+27 69 497 7018)'
        : `WhatsApp Recipient (+${cleanPhone})`),
    originalWhatsappUrl:
      params.originalWhatsappUrl ||
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMsg)}`,
    autoDispatchedReceipt: autoReceipt,
  };

  modalListeners.forEach((l) => l(reqPayload));
}

export const openScopeBridgeSupportChat = openOpenWaSupportChat;
export const openOpenWaSupportModal = openOpenWaSupportChat;

let interceptorInstalled = false;

/**
 * Global interceptor that enhances all WhatsApp links (wa.me / api.whatsapp.com)
 * across the platform with Scope Bridge Support capabilities while allowing
 * direct opening.
 */
export function installGlobalOpenWaLinkInterceptor(): void {
  if (typeof window === 'undefined' || interceptorInstalled) return;
  interceptorInstalled = true;

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      // Allow direct navigation if target is _blank and marked as direct-link or bypass
      if (anchor.dataset.openwaBypass === 'true' || anchor.target === '_blank') {
        return;
      }

      const href = anchor.getAttribute('href') || '';
      if (
        href.includes('wa.me/') ||
        href.includes('api.whatsapp.com/send') ||
        href.includes('whatsapp://send')
      ) {
        let phone = '27694977018';
        let message = 'Hello Scope Bridge Support, I am reaching out for assistance.';

        try {
          const urlObj = new URL(href, window.location.origin);
          if (urlObj.hostname.includes('wa.me')) {
            const pathDigits = urlObj.pathname.replace(/[^\d]/g, '');
            if (pathDigits) phone = pathDigits;
          } else if (urlObj.searchParams.get('phone')) {
            phone = urlObj.searchParams.get('phone')!.replace(/[^\d]/g, '') || phone;
          }
          const textParam = urlObj.searchParams.get('text');
          if (textParam && textParam.trim()) {
            message = textParam.trim();
          }
        } catch {
          // Use defaults if URL parsing fails
        }

        const buttonLabel = anchor.textContent?.trim() || 'Scope Bridge Support';

        openOpenWaSupportChat({
          phone,
          message,
          recipientLabel: buttonLabel,
          originalWhatsappUrl: href,
          autoSend: true,
        });
      }
    },
    true
  );
}
