export type Lang = 'fr' | 'en' | 'es';

const dict = {
  fr: {
    by: 'par', yourSelection: 'Votre sélection de photos', included: (n: number) => `${n} photo${n > 1 ? 's' : ''} incluse${n > 1 ? 's' : ''} dans votre forfait`,
    includedShort: 'incluses', extra: (n: number) => `${n} supplémentaire${n > 1 ? 's' : ''}`, packUsed: (p: number) => `Forfait utilisé — photos supplémentaires à ${p} € l’unité`,
    expiresIn: (d: number) => (d > 0 ? `Expire dans ${d} jour${d > 1 ? 's' : ''}` : 'Expire aujourd’hui'), extend: 'Prolonger', yourPhotos: 'Vos photos', hd: 'HD', confirmed: 'confirmées',
    hdByPhotographer: 'Les fichiers HD vous seront remis par votre photographe.', downloadAll: (n: number) => `Tout télécharger (${n})`, downloading: (i: number, n: number) => `Téléchargement ${i}/${n}…`, downloadHint: 'Fichiers originaux, qualité d’origine. Autorisez les téléchargements multiples si votre navigateur le demande.', download: 'Télécharger', poweredBy: 'Galerie privée propulsée par', backTop: 'Haut de page',
    choose: 'Choisissez vos photos', selectAll: 'Tout sélectionner', unlockAll: (n: number, p: number) => `Débloquer les ${n} photos · ${p} €`, soon: 'Les photos arrivent bientôt.', allUnlocked: 'Toutes les photos sont déverrouillées.',
    photo: (n: number) => `photo${n > 1 ? 's' : ''}`, clear: 'Effacer', pay: (t: number) => `Payer ${t} €`, confirm: 'Confirmer', selection: 'Votre sélection', includedLine: (n: number) => `${n} photo${n > 1 ? 's' : ''} incluse${n > 1 ? 's' : ''}`,
    extraLine: (n: number) => `${n} photo${n > 1 ? 's' : ''} supplémentaire${n > 1 ? 's' : ''}`, total: 'Total', includedNote: 'Ces photos sont incluses dans votre forfait.', confirmSel: 'Confirmer ma sélection', confirming: 'Confirmation…',
    extendTitle: 'Prolonger la galerie', extendText: (d: number | null, n: number) => `Votre galerie expire ${d !== null && d > 0 ? `dans ${d} jour${d > 1 ? 's' : ''}` : 'aujourd’hui'}. Prolongez-la de ${n} jours pour garder le temps de choisir.`, extension: 'Prolongation',
    allTitle: 'Toutes les photos', allText: (n: number) => `Débloquez d’un coup les ${n} photos restantes de la galerie, en HD, au tarif forfaitaire.`, allLine: (n: number) => `${n} photos · forfait`,
    paidBanner: 'Paiement confirmé — vos photos sont déverrouillées ci-dessous.', freeBanner: 'Sélection confirmée — vos photos sont disponibles ci-dessous.', extendedBanner: (n: number) => `Galerie prolongée de ${n} jours.`, allBanner: 'Toutes les photos sont déverrouillées. Merci !',
    payCard: 'Payer par carte bancaire', cardHint: 'Carte, Apple Pay, Google Pay — sans compte à créer', orPaypal: 'ou avec PayPal', redirecting: 'Redirection vers le paiement sécurisé…', canceled: 'Paiement annulé. Rien n’a été débité.', checkingPayment: 'Vérification du paiement…',
    secure: 'Paiement sécurisé · vos données bancaires ne transitent jamais par Track.Art', noPay: 'Le paiement en ligne n’est pas encore activé sur cette galerie. Contactez votre photographe.', ppLoad: 'Impossible de charger PayPal. Vérifiez votre connexion.', ppErr: 'Erreur PayPal. Veuillez réessayer.', ppValid: 'Paiement reçu mais erreur lors de la validation. Contactez votre photographe.', ppBtn: 'Impossible d’afficher les boutons PayPal.', processing: 'Traitement en cours…',
    prev: 'Photo précédente', next: 'Photo suivante', close: 'Fermer', selected: 'Sélectionnée', select: 'Sélectionner', zoom: 'Agrandir',
    private: 'Cette galerie est privée. Saisissez le mot de passe transmis par votre photographe.', password: 'Mot de passe', open: 'Ouvrir la galerie', opening: 'Ouverture…', checking: 'Vérification…', wrongPw: 'Mot de passe incorrect',
  },
  en: {
    by: 'by', yourSelection: 'Your photo selection', included: (n: number) => `${n} photo${n > 1 ? 's' : ''} included in your package`,
    includedShort: 'included', extra: (n: number) => `${n} extra${n > 1 ? 's' : ''}`, packUsed: (p: number) => `Package used — extra photos at €${p} each`,
    expiresIn: (d: number) => (d > 0 ? `Expires in ${d} day${d > 1 ? 's' : ''}` : 'Expires today'), extend: 'Extend', yourPhotos: 'Your photos', hd: 'HD', confirmed: 'confirmed',
    hdByPhotographer: 'Your photographer will deliver the HD files.', downloadAll: (n: number) => `Download all (${n})`, downloading: (i: number, n: number) => `Downloading ${i}/${n}…`, downloadHint: 'Original files, full quality. Allow multiple downloads if your browser asks.', download: 'Download', poweredBy: 'Private gallery powered by', backTop: 'Back to top',
    choose: 'Choose your photos', selectAll: 'Select all', unlockAll: (n: number, p: number) => `Unlock all ${n} photos · €${p}`, soon: 'Photos coming soon.', allUnlocked: 'All photos are unlocked.',
    photo: (n: number) => `photo${n > 1 ? 's' : ''}`, clear: 'Clear', pay: (t: number) => `Pay €${t}`, confirm: 'Confirm', selection: 'Your selection', includedLine: (n: number) => `${n} included photo${n > 1 ? 's' : ''}`,
    extraLine: (n: number) => `${n} extra photo${n > 1 ? 's' : ''}`, total: 'Total', includedNote: 'These photos are included in your package.', confirmSel: 'Confirm my selection', confirming: 'Confirming…',
    extendTitle: 'Extend the gallery', extendText: (d: number | null, n: number) => `Your gallery expires ${d !== null && d > 0 ? `in ${d} day${d > 1 ? 's' : ''}` : 'today'}. Extend it by ${n} days to keep choosing.`, extension: 'Extension',
    allTitle: 'All photos', allText: (n: number) => `Unlock the remaining ${n} photos of the gallery at once, in HD, at the package price.`, allLine: (n: number) => `${n} photos · package`,
    paidBanner: 'Payment confirmed — your photos are unlocked below.', freeBanner: 'Selection confirmed — your photos are available below.', extendedBanner: (n: number) => `Gallery extended by ${n} days.`, allBanner: 'All photos are unlocked. Thank you!',
    payCard: 'Pay by card', cardHint: 'Card, Apple Pay, Google Pay — no account needed', orPaypal: 'or with PayPal', redirecting: 'Redirecting to secure payment…', canceled: 'Payment cancelled. You were not charged.', checkingPayment: 'Checking payment…',
    secure: 'Secure payment · your card details never pass through Track.Art', noPay: 'Online payment is not enabled on this gallery yet. Please contact your photographer.', ppLoad: 'Could not load PayPal. Check your connection.', ppErr: 'PayPal error. Please try again.', ppValid: 'Payment received but validation failed. Please contact your photographer.', ppBtn: 'Could not display PayPal buttons.', processing: 'Processing…',
    prev: 'Previous photo', next: 'Next photo', close: 'Close', selected: 'Selected', select: 'Select', zoom: 'Zoom',
    private: 'This gallery is private. Enter the password given by your photographer.', password: 'Password', open: 'Open the gallery', opening: 'Opening…', checking: 'Checking…', wrongPw: 'Wrong password',
  },
  es: {
    by: 'por', yourSelection: 'Tu selección de fotos', included: (n: number) => `${n} foto${n > 1 ? 's' : ''} incluida${n > 1 ? 's' : ''} en tu paquete`,
    includedShort: 'incluidas', extra: (n: number) => `${n} adicional${n > 1 ? 'es' : ''}`, packUsed: (p: number) => `Paquete agotado — fotos adicionales a ${p} € cada una`,
    expiresIn: (d: number) => (d > 0 ? `Caduca en ${d} día${d > 1 ? 's' : ''}` : 'Caduca hoy'), extend: 'Prolongar', yourPhotos: 'Tus fotos', hd: 'HD', confirmed: 'confirmadas',
    hdByPhotographer: 'Tu fotógrafo te entregará los archivos HD.', downloadAll: (n: number) => `Descargar todo (${n})`, downloading: (i: number, n: number) => `Descargando ${i}/${n}…`, downloadHint: 'Archivos originales, calidad original. Permite las descargas múltiples si tu navegador lo pide.', download: 'Descargar', poweredBy: 'Galería privada con', backTop: 'Volver arriba',
    choose: 'Elige tus fotos', selectAll: 'Seleccionar todo', unlockAll: (n: number, p: number) => `Desbloquear las ${n} fotos · ${p} €`, soon: 'Las fotos llegan pronto.', allUnlocked: 'Todas las fotos están desbloqueadas.',
    photo: (n: number) => `foto${n > 1 ? 's' : ''}`, clear: 'Borrar', pay: (t: number) => `Pagar ${t} €`, confirm: 'Confirmar', selection: 'Tu selección', includedLine: (n: number) => `${n} foto${n > 1 ? 's' : ''} incluida${n > 1 ? 's' : ''}`,
    extraLine: (n: number) => `${n} foto${n > 1 ? 's' : ''} adicional${n > 1 ? 'es' : ''}`, total: 'Total', includedNote: 'Estas fotos están incluidas en tu paquete.', confirmSel: 'Confirmar mi selección', confirming: 'Confirmando…',
    extendTitle: 'Prolongar la galería', extendText: (d: number | null, n: number) => `Tu galería caduca ${d !== null && d > 0 ? `en ${d} día${d > 1 ? 's' : ''}` : 'hoy'}. Prolóngala ${n} días para seguir eligiendo.`, extension: 'Prolongación',
    allTitle: 'Todas las fotos', allText: (n: number) => `Desbloquea de una vez las ${n} fotos restantes de la galería, en HD, al precio del paquete.`, allLine: (n: number) => `${n} fotos · paquete`,
    paidBanner: 'Pago confirmado — tus fotos están desbloqueadas abajo.', freeBanner: 'Selección confirmada — tus fotos están disponibles abajo.', extendedBanner: (n: number) => `Galería prolongada ${n} días.`, allBanner: 'Todas las fotos están desbloqueadas. ¡Gracias!',
    payCard: 'Pagar con tarjeta', cardHint: 'Tarjeta, Apple Pay, Google Pay — sin crear cuenta', orPaypal: 'o con PayPal', redirecting: 'Redirigiendo al pago seguro…', canceled: 'Pago cancelado. No se ha cobrado nada.', checkingPayment: 'Comprobando el pago…',
    secure: 'Pago seguro · tus datos bancarios nunca pasan por Track.Art', noPay: 'El pago en línea aún no está activado en esta galería. Contacta con tu fotógrafo.', ppLoad: 'No se pudo cargar PayPal. Comprueba tu conexión.', ppErr: 'Error de PayPal. Inténtalo de nuevo.', ppValid: 'Pago recibido pero error de validación. Contacta con tu fotógrafo.', ppBtn: 'No se pudieron mostrar los botones de PayPal.', processing: 'Procesando…',
    prev: 'Foto anterior', next: 'Foto siguiente', close: 'Cerrar', selected: 'Seleccionada', select: 'Seleccionar', zoom: 'Ampliar',
    private: 'Esta galería es privada. Introduce la contraseña que te dio tu fotógrafo.', password: 'Contraseña', open: 'Abrir la galería', opening: 'Abriendo…', checking: 'Comprobando…', wrongPw: 'Contraseña incorrecta',
  },
};

export type Dict = typeof dict.fr;
export function getDict(languages?: string[] | null): { lang: Lang; t: Dict } {
  const l = (languages?.[0] ?? 'fr').slice(0, 2).toLowerCase();
  const lang: Lang = l === 'en' || l === 'es' ? l : 'fr';
  return { lang, t: dict[lang] as Dict };
}
export const LOCALE: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES' };
export const PAYPAL_LOCALE: Record<Lang, string> = { fr: 'fr_FR', en: 'en_GB', es: 'es_ES' };
