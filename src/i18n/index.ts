import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { supabase } from '../../lib/supabase';

// Supported languages (13 languages matching website)
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'he', name: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// Translations
const translations = {
  en: {
    // Auth
    login: 'Log In',
    signup: 'Create Account',
    email: 'Email',
    password: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone',
    termsAgree: 'By continuing, you agree to our Terms of Service',
    sanctuaryAwaits: 'Your Sanctuary Awaits',

    // Navigation
    home: 'Home',
    pass: 'Pass',
    book: 'Book',
    events: 'Events',
    profile: 'Profile',

    // Common
    continue: 'Continue',
    cancel: 'Cancel',
    save: 'Save',
    done: 'Done',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',

    // Language
    selectLanguage: 'Select Language',
    languageUpdated: 'Language updated',

    // Accessibility
    personalizeTitle: "Let's personalize Maslow for you",
    personalizeSubtitle: 'Choose any that apply (you can change these anytime in Settings)',
    reduceAnimations: 'Reduce animations',
    reduceAnimationsDesc: 'Disables spinning and transition effects',
    noHaptics: 'Turn off haptic feedback',
    noHapticsDesc: 'No vibrations when tapping',
    highContrast: 'High contrast mode',
    highContrastDesc: 'Stronger colors, more readable',
    largerText: 'Larger text',
    largerTextDesc: 'Increases all font sizes',
    screenReader: 'Screen reader optimized',
    screenReaderDesc: 'Better labels and descriptions',

    // Settings
    settings: 'Settings',
    accessibility: 'Accessibility',
    language: 'Language',
    notifications: 'Notifications',
    privacy: 'Privacy',
    support: 'Support',
    signOut: 'Sign Out',
    account: 'Account',
    paymentMethods: 'Payment Methods',
    preferences: 'Preferences',
    showConcierge: 'Show Concierge',
    conciergeDesc: 'AI assistant bubble on homepage',
    helpCenter: 'Help Center',
    contactSupport: 'Contact Support',
    termsAndConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    signOutConfirm: 'Are you sure you want to sign out?',
  },
  es: {
    login: 'Iniciar Sesión',
    signup: 'Crear Cuenta',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Teléfono',
    termsAgree: 'Al continuar, aceptas nuestros Términos de Servicio',
    sanctuaryAwaits: 'Tu Santuario Te Espera',
    home: 'Inicio',
    pass: 'Pase',
    book: 'Reservar',
    events: 'Eventos',
    profile: 'Perfil',
    continue: 'Continuar',
    cancel: 'Cancelar',
    save: 'Guardar',
    done: 'Listo',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    selectLanguage: 'Seleccionar Idioma',
    languageUpdated: 'Idioma actualizado',
    personalizeTitle: 'Personalicemos Maslow para ti',
    personalizeSubtitle: 'Elige lo que aplique (puedes cambiarlo en Configuración)',
    reduceAnimations: 'Reducir animaciones',
    reduceAnimationsDesc: 'Desactiva efectos de giro y transición',
    noHaptics: 'Desactivar vibración',
    noHapticsDesc: 'Sin vibraciones al tocar',
    highContrast: 'Modo alto contraste',
    highContrastDesc: 'Colores más fuertes, más legible',
    largerText: 'Texto más grande',
    largerTextDesc: 'Aumenta todos los tamaños de fuente',
    screenReader: 'Optimizado para lector de pantalla',
    screenReaderDesc: 'Mejores etiquetas y descripciones',
    settings: 'Configuración',
    accessibility: 'Accesibilidad',
    language: 'Idioma',
    notifications: 'Notificaciones',
    privacy: 'Privacidad',
    support: 'Soporte',
    signOut: 'Cerrar Sesión',
    account: 'Cuenta',
    paymentMethods: 'Métodos de Pago',
    preferences: 'Preferencias',
    showConcierge: 'Mostrar Conserje',
    conciergeDesc: 'Burbuja de asistente IA en la página principal',
    helpCenter: 'Centro de Ayuda',
    contactSupport: 'Contactar Soporte',
    termsAndConditions: 'Términos y Condiciones',
    privacyPolicy: 'Política de Privacidad',
    signOutConfirm: '¿Estás seguro de que quieres cerrar sesión?',
  },
  fr: {
    // Auth
    login: 'Se Connecter',
    signup: 'Créer un Compte',
    email: 'E-mail',
    password: 'Mot de passe',
    firstName: 'Prénom',
    lastName: 'Nom',
    phone: 'Téléphone',
    termsAgree: 'En continuant, vous acceptez nos Conditions d\'utilisation',
    sanctuaryAwaits: 'Votre Sanctuaire Vous Attend',
    // Navigation
    home: 'Accueil',
    pass: 'Pass',
    book: 'Réserver',
    events: 'Événements',
    profile: 'Profil',
    // Common
    continue: 'Continuer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    done: 'Terminé',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    // Language
    selectLanguage: 'Choisir la Langue',
    languageUpdated: 'Langue mise à jour',
    // Accessibility
    personalizeTitle: 'Personnalisons Maslow pour vous',
    personalizeSubtitle: 'Choisissez ce qui s\'applique (modifiable dans les Paramètres)',
    reduceAnimations: 'Réduire les animations',
    reduceAnimationsDesc: 'Désactive les effets de rotation et de transition',
    noHaptics: 'Désactiver le retour haptique',
    noHapticsDesc: 'Pas de vibrations lors des touches',
    highContrast: 'Mode contraste élevé',
    highContrastDesc: 'Couleurs plus fortes, plus lisible',
    largerText: 'Texte plus grand',
    largerTextDesc: 'Augmente toutes les tailles de police',
    screenReader: 'Optimisé lecteur d\'écran',
    screenReaderDesc: 'Meilleures étiquettes et descriptions',
    // Settings
    settings: 'Paramètres',
    accessibility: 'Accessibilité',
    language: 'Langue',
    notifications: 'Notifications',
    privacy: 'Confidentialité',
    support: 'Assistance',
    signOut: 'Se Déconnecter',
    account: 'Compte',
    paymentMethods: 'Moyens de Paiement',
    preferences: 'Préférences',
    showConcierge: 'Afficher le Concierge',
    conciergeDesc: 'Bulle d\'assistant IA sur la page d\'accueil',
    helpCenter: 'Centre d\'Aide',
    contactSupport: 'Contacter le Support',
    termsAndConditions: 'Conditions Générales',
    privacyPolicy: 'Politique de Confidentialité',
    signOutConfirm: 'Êtes-vous sûr de vouloir vous déconnecter ?',
  },
  de: {
    // Auth
    login: 'Anmelden',
    signup: 'Konto Erstellen',
    email: 'E-Mail',
    password: 'Passwort',
    firstName: 'Vorname',
    lastName: 'Nachname',
    phone: 'Telefon',
    termsAgree: 'Mit dem Fortfahren akzeptieren Sie unsere Nutzungsbedingungen',
    sanctuaryAwaits: 'Ihr Heiligtum Erwartet Sie',
    // Navigation
    home: 'Startseite',
    pass: 'Pass',
    book: 'Buchen',
    events: 'Veranstaltungen',
    profile: 'Profil',
    // Common
    continue: 'Weiter',
    cancel: 'Abbrechen',
    save: 'Speichern',
    done: 'Fertig',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    // Language
    selectLanguage: 'Sprache Wählen',
    languageUpdated: 'Sprache aktualisiert',
    // Accessibility
    personalizeTitle: 'Personalisieren wir Maslow für Sie',
    personalizeSubtitle: 'Wählen Sie, was zutrifft (änderbar in Einstellungen)',
    reduceAnimations: 'Animationen reduzieren',
    reduceAnimationsDesc: 'Deaktiviert Dreh- und Übergangseffekte',
    noHaptics: 'Haptisches Feedback deaktivieren',
    noHapticsDesc: 'Keine Vibrationen beim Tippen',
    highContrast: 'Hoher Kontrast',
    highContrastDesc: 'Stärkere Farben, besser lesbar',
    largerText: 'Größerer Text',
    largerTextDesc: 'Vergrößert alle Schriftgrößen',
    screenReader: 'Bildschirmleser optimiert',
    screenReaderDesc: 'Bessere Beschriftungen und Beschreibungen',
    // Settings
    settings: 'Einstellungen',
    accessibility: 'Barrierefreiheit',
    language: 'Sprache',
    notifications: 'Benachrichtigungen',
    privacy: 'Datenschutz',
    support: 'Support',
    signOut: 'Abmelden',
    account: 'Konto',
    paymentMethods: 'Zahlungsmethoden',
    preferences: 'Präferenzen',
    showConcierge: 'Concierge Anzeigen',
    conciergeDesc: 'KI-Assistent-Blase auf der Startseite',
    helpCenter: 'Hilfezentrum',
    contactSupport: 'Support Kontaktieren',
    termsAndConditions: 'Allgemeine Geschäftsbedingungen',
    privacyPolicy: 'Datenschutzrichtlinie',
    signOutConfirm: 'Sind Sie sicher, dass Sie sich abmelden möchten?',
  },
  it: {
    // Auth
    login: 'Accedi',
    signup: 'Crea Account',
    email: 'E-mail',
    password: 'Password',
    firstName: 'Nome',
    lastName: 'Cognome',
    phone: 'Telefono',
    termsAgree: 'Continuando, accetti i nostri Termini di Servizio',
    sanctuaryAwaits: 'Il Tuo Santuario Ti Aspetta',
    // Navigation
    home: 'Home',
    pass: 'Pass',
    book: 'Prenota',
    events: 'Eventi',
    profile: 'Profilo',
    // Common
    continue: 'Continua',
    cancel: 'Annulla',
    save: 'Salva',
    done: 'Fatto',
    loading: 'Caricamento...',
    error: 'Errore',
    success: 'Successo',
    // Language
    selectLanguage: 'Seleziona Lingua',
    languageUpdated: 'Lingua aggiornata',
    // Accessibility
    personalizeTitle: 'Personalizziamo Maslow per te',
    personalizeSubtitle: 'Scegli ciò che si applica (modificabile nelle Impostazioni)',
    reduceAnimations: 'Riduci animazioni',
    reduceAnimationsDesc: 'Disattiva effetti di rotazione e transizione',
    noHaptics: 'Disattiva feedback aptico',
    noHapticsDesc: 'Nessuna vibrazione quando tocchi',
    highContrast: 'Modalità alto contrasto',
    highContrastDesc: 'Colori più forti, più leggibile',
    largerText: 'Testo più grande',
    largerTextDesc: 'Aumenta tutte le dimensioni dei caratteri',
    screenReader: 'Ottimizzato per screen reader',
    screenReaderDesc: 'Etichette e descrizioni migliori',
    // Settings
    settings: 'Impostazioni',
    accessibility: 'Accessibilità',
    language: 'Lingua',
    notifications: 'Notifiche',
    privacy: 'Privacy',
    support: 'Supporto',
    signOut: 'Esci',
    account: 'Account',
    paymentMethods: 'Metodi di Pagamento',
    preferences: 'Preferenze',
    showConcierge: 'Mostra Concierge',
    conciergeDesc: 'Bolla assistente IA nella homepage',
    helpCenter: 'Centro Assistenza',
    contactSupport: 'Contatta Supporto',
    termsAndConditions: 'Termini e Condizioni',
    privacyPolicy: 'Informativa sulla Privacy',
    signOutConfirm: 'Sei sicuro di voler uscire?',
  },
  pt: {
    // Auth
    login: 'Entrar',
    signup: 'Criar Conta',
    email: 'E-mail',
    password: 'Senha',
    firstName: 'Nome',
    lastName: 'Sobrenome',
    phone: 'Telefone',
    termsAgree: 'Ao continuar, você aceita nossos Termos de Serviço',
    sanctuaryAwaits: 'Seu Santuário Aguarda',
    // Navigation
    home: 'Início',
    pass: 'Passe',
    book: 'Reservar',
    events: 'Eventos',
    profile: 'Perfil',
    // Common
    continue: 'Continuar',
    cancel: 'Cancelar',
    save: 'Salvar',
    done: 'Concluído',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    // Language
    selectLanguage: 'Selecionar Idioma',
    languageUpdated: 'Idioma atualizado',
    // Accessibility
    personalizeTitle: 'Vamos personalizar o Maslow para você',
    personalizeSubtitle: 'Escolha o que se aplica (alterável nas Configurações)',
    reduceAnimations: 'Reduzir animações',
    reduceAnimationsDesc: 'Desativa efeitos de rotação e transição',
    noHaptics: 'Desativar feedback háptico',
    noHapticsDesc: 'Sem vibrações ao tocar',
    highContrast: 'Modo alto contraste',
    highContrastDesc: 'Cores mais fortes, mais legível',
    largerText: 'Texto maior',
    largerTextDesc: 'Aumenta todos os tamanhos de fonte',
    screenReader: 'Otimizado para leitor de tela',
    screenReaderDesc: 'Melhores rótulos e descrições',
    // Settings
    settings: 'Configurações',
    accessibility: 'Acessibilidade',
    language: 'Idioma',
    notifications: 'Notificações',
    privacy: 'Privacidade',
    support: 'Suporte',
    signOut: 'Sair',
    account: 'Conta',
    paymentMethods: 'Métodos de Pagamento',
    preferences: 'Preferências',
    showConcierge: 'Mostrar Concierge',
    conciergeDesc: 'Bolha de assistente IA na página inicial',
    helpCenter: 'Central de Ajuda',
    contactSupport: 'Contatar Suporte',
    termsAndConditions: 'Termos e Condições',
    privacyPolicy: 'Política de Privacidade',
    signOutConfirm: 'Tem certeza de que deseja sair?',
  },
  zh: {
    // Auth
    login: '登录',
    signup: '创建账户',
    email: '电子邮件',
    password: '密码',
    firstName: '名',
    lastName: '姓',
    phone: '电话',
    termsAgree: '继续即表示您同意我们的服务条款',
    sanctuaryAwaits: '您的圣所在等待',
    // Navigation
    home: '首页',
    pass: '通行证',
    book: '预订',
    events: '活动',
    profile: '个人资料',
    // Common
    continue: '继续',
    cancel: '取消',
    save: '保存',
    done: '完成',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    // Language
    selectLanguage: '选择语言',
    languageUpdated: '语言已更新',
    // Accessibility
    personalizeTitle: '让我们为您个性化Maslow',
    personalizeSubtitle: '选择适用的选项（可在设置中更改）',
    reduceAnimations: '减少动画',
    reduceAnimationsDesc: '禁用旋转和过渡效果',
    noHaptics: '关闭触觉反馈',
    noHapticsDesc: '点击时无振动',
    highContrast: '高对比度模式',
    highContrastDesc: '更强的颜色，更易阅读',
    largerText: '更大的文字',
    largerTextDesc: '增大所有字体大小',
    screenReader: '屏幕阅读器优化',
    screenReaderDesc: '更好的标签和描述',
    // Settings
    settings: '设置',
    accessibility: '无障碍',
    language: '语言',
    notifications: '通知',
    privacy: '隐私',
    support: '支持',
    signOut: '退出登录',
    account: '账户',
    paymentMethods: '支付方式',
    preferences: '偏好设置',
    showConcierge: '显示礼宾服务',
    conciergeDesc: '首页AI助手气泡',
    helpCenter: '帮助中心',
    contactSupport: '联系客服',
    termsAndConditions: '条款与条件',
    privacyPolicy: '隐私政策',
    signOutConfirm: '您确定要退出登录吗？',
  },
  ja: {
    // Auth
    login: 'ログイン',
    signup: 'アカウント作成',
    email: 'メールアドレス',
    password: 'パスワード',
    firstName: '名',
    lastName: '姓',
    phone: '電話番号',
    termsAgree: '続行することで、利用規約に同意したことになります',
    sanctuaryAwaits: 'あなたの聖域が待っています',
    // Navigation
    home: 'ホーム',
    pass: 'パス',
    book: '予約',
    events: 'イベント',
    profile: 'プロフィール',
    // Common
    continue: '続ける',
    cancel: 'キャンセル',
    save: '保存',
    done: '完了',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    // Language
    selectLanguage: '言語を選択',
    languageUpdated: '言語が更新されました',
    // Accessibility
    personalizeTitle: 'Maslowをあなた向けにカスタマイズ',
    personalizeSubtitle: '該当するものを選択してください（設定で変更可能）',
    reduceAnimations: 'アニメーションを減らす',
    reduceAnimationsDesc: '回転と遷移効果を無効にする',
    noHaptics: '触覚フィードバックをオフ',
    noHapticsDesc: 'タップ時に振動なし',
    highContrast: '高コントラストモード',
    highContrastDesc: 'より強い色、より読みやすい',
    largerText: '大きい文字',
    largerTextDesc: 'すべてのフォントサイズを拡大',
    screenReader: 'スクリーンリーダー最適化',
    screenReaderDesc: 'より良いラベルと説明',
    // Settings
    settings: '設定',
    accessibility: 'アクセシビリティ',
    language: '言語',
    notifications: '通知',
    privacy: 'プライバシー',
    support: 'サポート',
    signOut: 'ログアウト',
    account: 'アカウント',
    paymentMethods: 'お支払い方法',
    preferences: '設定',
    showConcierge: 'コンシェルジュを表示',
    conciergeDesc: 'ホームページのAIアシスタントバブル',
    helpCenter: 'ヘルプセンター',
    contactSupport: 'サポートに連絡',
    termsAndConditions: '利用規約',
    privacyPolicy: 'プライバシーポリシー',
    signOutConfirm: 'ログアウトしてもよろしいですか？',
  },
  ko: {
    // Auth
    login: '로그인',
    signup: '계정 만들기',
    email: '이메일',
    password: '비밀번호',
    firstName: '이름',
    lastName: '성',
    phone: '전화번호',
    termsAgree: '계속하면 서비스 약관에 동의하는 것입니다',
    sanctuaryAwaits: '당신의 성소가 기다립니다',
    // Navigation
    home: '홈',
    pass: '패스',
    book: '예약',
    events: '이벤트',
    profile: '프로필',
    // Common
    continue: '계속',
    cancel: '취소',
    save: '저장',
    done: '완료',
    loading: '로딩 중...',
    error: '오류',
    success: '성공',
    // Language
    selectLanguage: '언어 선택',
    languageUpdated: '언어가 업데이트되었습니다',
    // Accessibility
    personalizeTitle: 'Maslow를 맞춤 설정해드릴게요',
    personalizeSubtitle: '해당하는 것을 선택하세요 (설정에서 변경 가능)',
    reduceAnimations: '애니메이션 줄이기',
    reduceAnimationsDesc: '회전 및 전환 효과 비활성화',
    noHaptics: '햅틱 피드백 끄기',
    noHapticsDesc: '탭할 때 진동 없음',
    highContrast: '고대비 모드',
    highContrastDesc: '더 강한 색상, 더 읽기 쉬움',
    largerText: '큰 텍스트',
    largerTextDesc: '모든 글꼴 크기 증가',
    screenReader: '스크린 리더 최적화',
    screenReaderDesc: '더 나은 레이블과 설명',
    // Settings
    settings: '설정',
    accessibility: '접근성',
    language: '언어',
    notifications: '알림',
    privacy: '개인정보',
    support: '지원',
    signOut: '로그아웃',
    account: '계정',
    paymentMethods: '결제 수단',
    preferences: '환경설정',
    showConcierge: '컨시어지 표시',
    conciergeDesc: '홈페이지의 AI 어시스턴트 버블',
    helpCenter: '고객센터',
    contactSupport: '지원 문의',
    termsAndConditions: '이용약관',
    privacyPolicy: '개인정보처리방침',
    signOutConfirm: '로그아웃 하시겠습니까?',
  },
  ar: {
    // Auth
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    phone: 'الهاتف',
    termsAgree: 'بالمتابعة، أنت توافق على شروط الخدمة',
    sanctuaryAwaits: 'ملاذك في انتظارك',
    // Navigation
    home: 'الرئيسية',
    pass: 'التذكرة',
    book: 'حجز',
    events: 'الفعاليات',
    profile: 'الملف الشخصي',
    // Common
    continue: 'متابعة',
    cancel: 'إلغاء',
    save: 'حفظ',
    done: 'تم',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجاح',
    // Language
    selectLanguage: 'اختر اللغة',
    languageUpdated: 'تم تحديث اللغة',
    // Accessibility
    personalizeTitle: 'دعنا نخصص Maslow لك',
    personalizeSubtitle: 'اختر ما ينطبق (يمكن تغييره في الإعدادات)',
    reduceAnimations: 'تقليل الحركات',
    reduceAnimationsDesc: 'تعطيل تأثيرات الدوران والانتقال',
    noHaptics: 'إيقاف الاهتزاز',
    noHapticsDesc: 'لا اهتزاز عند اللمس',
    highContrast: 'وضع التباين العالي',
    highContrastDesc: 'ألوان أقوى، أسهل للقراءة',
    largerText: 'نص أكبر',
    largerTextDesc: 'زيادة جميع أحجام الخطوط',
    screenReader: 'محسّن لقارئ الشاشة',
    screenReaderDesc: 'تسميات وأوصاف أفضل',
    // Settings
    settings: 'الإعدادات',
    accessibility: 'إمكانية الوصول',
    language: 'اللغة',
    notifications: 'الإشعارات',
    privacy: 'الخصوصية',
    support: 'الدعم',
    signOut: 'تسجيل الخروج',
    account: 'الحساب',
    paymentMethods: 'طرق الدفع',
    preferences: 'التفضيلات',
    showConcierge: 'إظهار المساعد',
    conciergeDesc: 'فقاعة مساعد الذكاء الاصطناعي في الصفحة الرئيسية',
    helpCenter: 'مركز المساعدة',
    contactSupport: 'اتصل بالدعم',
    termsAndConditions: 'الشروط والأحكام',
    privacyPolicy: 'سياسة الخصوصية',
    signOutConfirm: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
  },
  ru: {
    // Auth
    login: 'Войти',
    signup: 'Создать Аккаунт',
    email: 'Электронная почта',
    password: 'Пароль',
    firstName: 'Имя',
    lastName: 'Фамилия',
    phone: 'Телефон',
    termsAgree: 'Продолжая, вы соглашаетесь с Условиями использования',
    sanctuaryAwaits: 'Ваше Убежище Ждёт',
    // Navigation
    home: 'Главная',
    pass: 'Пропуск',
    book: 'Бронировать',
    events: 'События',
    profile: 'Профиль',
    // Common
    continue: 'Продолжить',
    cancel: 'Отмена',
    save: 'Сохранить',
    done: 'Готово',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    // Language
    selectLanguage: 'Выбрать Язык',
    languageUpdated: 'Язык обновлён',
    // Accessibility
    personalizeTitle: 'Настроим Maslow для вас',
    personalizeSubtitle: 'Выберите подходящее (можно изменить в Настройках)',
    reduceAnimations: 'Уменьшить анимацию',
    reduceAnimationsDesc: 'Отключает эффекты вращения и перехода',
    noHaptics: 'Отключить вибрацию',
    noHapticsDesc: 'Без вибрации при нажатии',
    highContrast: 'Высокий контраст',
    highContrastDesc: 'Более яркие цвета, легче читать',
    largerText: 'Крупный текст',
    largerTextDesc: 'Увеличивает все размеры шрифтов',
    screenReader: 'Для программ чтения',
    screenReaderDesc: 'Улучшенные метки и описания',
    // Settings
    settings: 'Настройки',
    accessibility: 'Доступность',
    language: 'Язык',
    notifications: 'Уведомления',
    privacy: 'Конфиденциальность',
    support: 'Поддержка',
    signOut: 'Выйти',
    account: 'Аккаунт',
    paymentMethods: 'Способы оплаты',
    preferences: 'Предпочтения',
    showConcierge: 'Показать консьержа',
    conciergeDesc: 'Пузырь ИИ-помощника на главной странице',
    helpCenter: 'Центр помощи',
    contactSupport: 'Связаться с поддержкой',
    termsAndConditions: 'Условия использования',
    privacyPolicy: 'Политика конфиденциальности',
    signOutConfirm: 'Вы уверены, что хотите выйти?',
  },
  hi: {
    // Auth
    login: 'लॉग इन करें',
    signup: 'खाता बनाएं',
    email: 'ईमेल',
    password: 'पासवर्ड',
    firstName: 'पहला नाम',
    lastName: 'उपनाम',
    phone: 'फ़ोन',
    termsAgree: 'जारी रखकर, आप हमारी सेवा की शर्तों से सहमत होते हैं',
    sanctuaryAwaits: 'आपका अभयारण्य इंतज़ार कर रहा है',
    // Navigation
    home: 'होम',
    pass: 'पास',
    book: 'बुक करें',
    events: 'इवेंट्स',
    profile: 'प्रोफ़ाइल',
    // Common
    continue: 'जारी रखें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    done: 'हो गया',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    // Language
    selectLanguage: 'भाषा चुनें',
    languageUpdated: 'भाषा अपडेट हुई',
    // Accessibility
    personalizeTitle: 'आइए Maslow को आपके लिए वैयक्तिकृत करें',
    personalizeSubtitle: 'जो लागू हो उसे चुनें (सेटिंग्स में बदल सकते हैं)',
    reduceAnimations: 'एनिमेशन कम करें',
    reduceAnimationsDesc: 'घूर्णन और संक्रमण प्रभाव अक्षम करें',
    noHaptics: 'हैप्टिक फीडबैक बंद करें',
    noHapticsDesc: 'टैप करने पर कोई कंपन नहीं',
    highContrast: 'उच्च कंट्रास्ट मोड',
    highContrastDesc: 'मजबूत रंग, अधिक पठनीय',
    largerText: 'बड़ा टेक्स्ट',
    largerTextDesc: 'सभी फ़ॉन्ट आकार बढ़ाएं',
    screenReader: 'स्क्रीन रीडर अनुकूलित',
    screenReaderDesc: 'बेहतर लेबल और विवरण',
    // Settings
    settings: 'सेटिंग्स',
    accessibility: 'सुलभता',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    privacy: 'गोपनीयता',
    support: 'सहायता',
    signOut: 'साइन आउट',
    account: 'खाता',
    paymentMethods: 'भुगतान के तरीके',
    preferences: 'प्राथमिकताएं',
    showConcierge: 'कंसीयज दिखाएं',
    conciergeDesc: 'होमपेज पर AI सहायक बबल',
    helpCenter: 'सहायता केंद्र',
    contactSupport: 'सहायता से संपर्क करें',
    termsAndConditions: 'नियम और शर्तें',
    privacyPolicy: 'गोपनीयता नीति',
    signOutConfirm: 'क्या आप वाकई साइन आउट करना चाहते हैं?',
  },
  he: {
    // Auth
    login: 'התחברות',
    signup: 'יצירת חשבון',
    email: 'אימייל',
    password: 'סיסמה',
    firstName: 'שם פרטי',
    lastName: 'שם משפחה',
    phone: 'טלפון',
    termsAgree: 'בהמשך, אתה מסכים לתנאי השירות שלנו',
    sanctuaryAwaits: 'המקדש שלך מחכה',
    // Navigation
    home: 'בית',
    pass: 'כרטיס',
    book: 'הזמנה',
    events: 'אירועים',
    profile: 'פרופיל',
    // Common
    continue: 'המשך',
    cancel: 'ביטול',
    save: 'שמור',
    done: 'סיום',
    loading: 'טוען...',
    error: 'שגיאה',
    success: 'הצלחה',
    // Language
    selectLanguage: 'בחר שפה',
    languageUpdated: 'השפה עודכנה',
    // Accessibility
    personalizeTitle: 'בואו נתאים את Maslow עבורך',
    personalizeSubtitle: 'בחר מה שמתאים (ניתן לשנות בהגדרות)',
    reduceAnimations: 'הפחתת אנימציות',
    reduceAnimationsDesc: 'משבית אפקטי סיבוב ומעברים',
    noHaptics: 'כיבוי משוב הפטי',
    noHapticsDesc: 'ללא רטט בעת נגיעה',
    highContrast: 'מצב ניגודיות גבוהה',
    highContrastDesc: 'צבעים חזקים יותר, קריא יותר',
    largerText: 'טקסט גדול יותר',
    largerTextDesc: 'מגדיל את כל גדלי הגופנים',
    screenReader: 'מותאם לקורא מסך',
    screenReaderDesc: 'תוויות ותיאורים טובים יותר',
    // Settings
    settings: 'הגדרות',
    accessibility: 'נגישות',
    language: 'שפה',
    notifications: 'התראות',
    privacy: 'פרטיות',
    support: 'תמיכה',
    signOut: 'התנתקות',
    account: 'חשבון',
    paymentMethods: 'אמצעי תשלום',
    preferences: 'העדפות',
    showConcierge: 'הצג קונסיירז\'',
    conciergeDesc: 'בועת עוזר AI בדף הבית',
    helpCenter: 'מרכז עזרה',
    contactSupport: 'צור קשר עם התמיכה',
    termsAndConditions: 'תנאים והגבלות',
    privacyPolicy: 'מדיניות פרטיות',
    signOutConfirm: 'האם אתה בטוח שברצונך להתנתק?',
  },
};

// Create i18n instance
export const i18n = new I18n(translations);

// Set default locale
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Get device locale
export function getDeviceLanguage(): LanguageCode {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const deviceLang = locales[0].languageCode;
      // Check if device language is supported
      const supported = SUPPORTED_LANGUAGES.find(l => l.code === deviceLang);
      if (supported) {
        return supported.code;
      }
    }
  } catch (error) {
    console.log('Could not detect device language:', error);
  }
  return 'en';
}

// Set language
export function setLanguage(languageCode: LanguageCode): void {
  i18n.locale = languageCode;
}

// Get current language
export function getCurrentLanguage(): LanguageCode {
  return i18n.locale as LanguageCode;
}

// Save language preference to Supabase
export async function saveLanguagePreference(userId: string, languageCode: LanguageCode): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ preferred_language: languageCode })
      .eq('id', userId);

    if (error) {
      console.error('Error saving language preference:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving language preference:', error);
    return false;
  }
}

// Load language preference from Supabase
export async function loadLanguagePreference(userId: string): Promise<LanguageCode | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', userId)
      .single();

    if (error || !data?.preferred_language) {
      return null;
    }

    return data.preferred_language as LanguageCode;
  } catch (error) {
    console.error('Error loading language preference:', error);
    return null;
  }
}

// Initialize language (called on app start)
export async function initializeLanguage(userId?: string): Promise<LanguageCode> {
  let language: LanguageCode = 'en';

  // Try to load from profile if logged in
  if (userId) {
    const saved = await loadLanguagePreference(userId);
    if (saved) {
      language = saved;
    }
  }

  // Fallback to device language
  if (language === 'en' && !userId) {
    language = getDeviceLanguage();
  }

  setLanguage(language);
  return language;
}

// Translation helper
export function t(key: string, options?: object): string {
  return i18n.t(key, options);
}

export default i18n;
