import { Platform, NativeModules } from 'react-native';

export type LanguageCode =
  | 'az'
  | 'en'
  | 'ru'
  | 'tr'
  | 'hi'
  | 'gu'
  | 'es'
  | 'fr'
  | 'de'
  | 'ar'
  | 'zh'
  | 'pt'
  | 'ja'
  | 'auto';

export type ResolvedLanguage = Exclude<LanguageCode, 'auto'>;

export const SUPPORTED_LANGUAGES: ResolvedLanguage[] = [
  'en', 'az', 'ru', 'tr', 'hi', 'gu', 'es', 'fr', 'de', 'ar', 'zh', 'pt', 'ja',
];

export const RTL_LANGUAGES: ResolvedLanguage[] = ['ar'];

export interface Translation {
  // Header
  monitor: string;
  entries: (n: number) => string;

  // Floating button
  debug: string;

  // Tabs
  all: string;
  network: string;
  logs: string;
  ws: string;
  fps: string;
  settings: string;

  // Search / filter
  search: string;
  allFilter: string;
  success2xx3xx: string;
  error4xx5xx: string;

  // Empty state
  empty: string;
  emptySubtitle: string;

  // Settings — sections
  deviceInfo: string;
  advancedTools: string;
  selectSource: string;
  manualEntry: string;
  customUrl: string;
  manualUrlPlaceholder: string;

  // Settings — buttons
  applyChanges: string;
  shareJsonReport: string;
  shareTextReport: string;
  saveJsonReportToFile: string;
  saveTextReportToFile: string;
  wipeAllRecords: string;

  // Environment
  productionApi: string;
  testApi: string;
  productive: string;
  demonstration: string;
  unknown: string;

  // Performance panel
  currentFps: string;
  averageFps: string;
  minFps: string;
  maxFps: string;
  droppedFrames: string;
  fpsHistory: string;
  fpsMonitorActive: string;
  fpsMonitorOff: string;
  fpsEmpty: string;

  // WebSocket panel
  noWebSocketActivity: string;
  wsSubtitle: string;
  wsOpen: string;
  wsClose: string;
  wsError: string;
  wsMsg: string;

  // Device info
  device: string;
  application: string;
  platform: string;
  model: string;
  screen: string;
  appVersion: string;
  buildVersion: string;

  // Detail modal
  consoleError: string;
  logMessage: string;
  websocketEvent: string;
  performanceData: string;
  data: string;
  method: string;
  url: string;
  headers: string;
  statusCode: string;
  body: string;
  shareEntry: string;
  shareCurl: string;
  closeMenu: string;
  curlCommand: string;
  back: string;
  request: string;
  response: string;
  close: string;
  exit: string;

  // Detail formatting
  ms: string;
  kb: string;
  error: string;

  // Password modal
  login: string;
  passPlaceholder: string;
  cancel: string;
  confirm: string;
  wrongPass: string;
  clicks: (n: number) => string;

  // Alerts
  pleaseEnterUrl: string;
  urlMustStartWith: string;
  invalidDomainFormat: string;
  invalidUrlFormat: string;
  success: string;
  newSourceApplied: string;
  couldNotShareReport: string;
  couldNotShareLog: string;
  couldNotShare: string;
  reportTitle: string;
  logShareTitle: string;

  // Log chips
  logChipError: string;

  // Store / State tab
  store: string;
  action: string;
  state: string;
  prevState: string;
  nextState: string;
  diff: string;
  snapshot: string;
  noStoreActivity: string;
  storeSubtitle: string;
  actionType: string;
  actionPayload: string;
  changedKeys: string;
  fullState: string;
}

const en: Translation = {
  monitor: 'Monitor',
  entries: (n) => `${n} ${n === 1 ? 'entry' : 'entries'}`,

  debug: 'DEBUG',

  all: 'All',
  network: 'Network',
  logs: 'Logs',
  ws: 'WS',
  fps: 'FPS',
  settings: 'Settings',

  search: 'Search...',
  allFilter: 'All',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'No logs found',
  emptySubtitle: 'Requests will appear here automatically',

  deviceInfo: 'DEVICE INFO',
  advancedTools: 'ADVANCED TOOLS',
  selectSource: 'SELECT SOURCE',
  manualEntry: 'MANUAL ENTRY',
  customUrl: 'CUSTOM URL',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'APPLY CHANGES',
  shareJsonReport: 'SHARE JSON REPORT',
  shareTextReport: 'SHARE TEXT REPORT',
  saveJsonReportToFile: 'SAVE JSON REPORT TO FILE',
  saveTextReportToFile: 'SAVE TEXT REPORT TO FILE',
  wipeAllRecords: 'WIPE ALL RECORDS',

  productionApi: 'PRODUCTION API (PROD)',
  testApi: 'TEST API (TEST)',
  productive: 'PRODUCTIVE (PROD)',
  demonstration: 'DEMONSTRATION (DEMO)',
  unknown: 'Unknown',

  currentFps: 'CURRENT FPS',
  averageFps: 'AVERAGE FPS',
  minFps: 'MIN FPS',
  maxFps: 'MAX FPS',
  droppedFrames: 'DROPPED FRAMES',
  fpsHistory: 'FPS HISTORY (LAST 60 SECONDS)',
  fpsMonitorActive: 'FPS Monitor Active',
  fpsMonitorOff: 'FPS Monitor Off',
  fpsEmpty: 'Tap the toggle above to start monitoring FPS',

  noWebSocketActivity: 'NO WEBSOCKET ACTIVITY',
  wsSubtitle: 'WebSocket connections are automatically intercepted',
  wsOpen: 'OPEN',
  wsClose: 'CLOSE',
  wsError: 'ERROR',
  wsMsg: 'MSG',

  device: 'DEVICE',
  application: 'APPLICATION',
  platform: 'Platform',
  model: 'Model',
  screen: 'Screen',
  appVersion: 'App Version',
  buildVersion: 'Build Version',

  consoleError: 'CONSOLE ERROR',
  logMessage: 'LOG MESSAGE',
  websocketEvent: 'WEBSOCKET EVENT',
  performanceData: 'PERFORMANCE DATA',
  data: 'DATA',
  method: 'METHOD',
  url: 'URL',
  headers: 'HEADERS',
  statusCode: 'STATUS CODE',
  body: 'BODY',
  shareEntry: 'Share Entry',
  shareCurl: 'Share cURL',
  closeMenu: 'Close',
  curlCommand: 'cURL Command',
  back: 'Back',
  request: 'REQUEST',
  response: 'RESPONSE',
  close: 'Close',
  exit: 'Exit',

  ms: 'ms',
  kb: 'kb',
  error: 'Error',

  login: 'Debug Login',
  passPlaceholder: 'Enter password',
  cancel: 'Cancel',
  confirm: 'Confirm',
  wrongPass: 'Wrong password',
  clicks: (n) => `${n} clicks detected`,

  pleaseEnterUrl: 'Please enter a URL',
  urlMustStartWith: 'URL must start with http:// or https://',
  invalidDomainFormat:
    'Invalid domain format. Example: https://api.example.com or http://localhost',
  invalidUrlFormat:
    'Invalid URL format. Please include protocol (e.g., https://api.example.com)',
  success: 'Success',
  newSourceApplied: 'New source applied',
  couldNotShareReport: 'Could not share report',
  couldNotShareLog: 'Could not share log',
  couldNotShare: 'Could not share',
  reportTitle: 'Network Monitor Export Report',
  logShareTitle: 'Log Entry',

  logChipError: 'ERROR',

  store: 'Store',
  action: 'Action',
  state: 'State',
  prevState: 'Previous State',
  nextState: 'Next State',
  diff: 'Diff',
  snapshot: 'Snapshot',
  noStoreActivity: 'No state changes recorded',
  storeSubtitle: 'State changes tracked via middleware or subscriber',
  actionType: 'Action Type',
  actionPayload: 'Action Payload',
  changedKeys: 'Changed Keys',
  fullState: 'Full State',
};

const az: Translation = {
  monitor: 'Monitor',
  entries: (n) => `${n} ${n === 1 ? 'qeyd' : 'qeyd'}`,

  debug: 'DEBUG',

  all: 'Hamısı',
  network: 'Şəbəkə',
  logs: 'Jurnallar',
  ws: 'WS',
  fps: 'FPS',
  settings: 'Parametrlər',

  search: 'Axtarış...',
  allFilter: 'Hamısı',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'Jurnal tapılmadı',
  emptySubtitle: 'Sorğular avtomatik olaraq burada görünəcək',

  deviceInfo: 'CİHAZ HAQQINDA',
  advancedTools: 'ƏLAVƏ ALƏTLƏR',
  selectSource: 'MƏNBƏ SEÇİN',
  manualEntry: 'ƏL İLƏ DAXİLETMƏ',
  customUrl: 'FƏRDİ URL',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'DƏYİŞİKLİKLƏRİ TƏTBİQ ET',
  shareJsonReport: 'JSON HESABATI PAYLAŞ',
  shareTextReport: 'MƏTN HESABATI PAYLAŞ',
  saveJsonReportToFile: 'JSON HESABATI FAYLA SAXLA',
  saveTextReportToFile: 'MƏTN HESABATI FAYLA SAXLA',
  wipeAllRecords: 'BÜTÜN QEYDLƏRİ SİL',

  productionApi: 'İSTEHSAL API (PROD)',
  testApi: 'TEST API (TEST)',
  productive: 'İSTEHSAL (PROD)',
  demonstration: 'NÜMAYİŞ (DEMO)',
  unknown: 'Naməlum',

  currentFps: 'CARİ FPS',
  averageFps: 'ORTA FPS',
  minFps: 'MİNİMUM FPS',
  maxFps: 'MAKSİMUM FPS',
  droppedFrames: 'İTİRİLMİŞ KADRLAR',
  fpsHistory: 'FPS TARİXÇƏSİ (SON 60 SANİYƏ)',
  fpsMonitorActive: 'FPS Monitor Aktiv',
  fpsMonitorOff: 'FPS Monitor Bağlıdır',
  fpsEmpty: 'FPS izləməyə başlamaq üçün yuxarıdakı keçidə basın',

  noWebSocketActivity: 'WEB SOCKET FƏALİYYƏTİ YOXDUR',
  wsSubtitle: 'WebSocket bağlantıları avtomatik izlənilir',
  wsOpen: 'AÇIQ',
  wsClose: 'BAĞLI',
  wsError: 'XƏTA',
  wsMsg: 'MSG',

  device: 'CİHAZ',
  application: 'TƏTBİQ',
  platform: 'Platforma',
  model: 'Model',
  screen: 'Ekran',
  appVersion: 'Tətbiq Versiyası',
  buildVersion: 'Build Versiyası',

  consoleError: 'KONSOL XƏTASI',
  logMessage: 'JURNAL MESAJI',
  websocketEvent: 'WEBSOCKET HADASİ',
  performanceData: 'PERFORMANS MƏLUMATI',
  data: 'MƏLUMAT',
  method: 'METOD',
  url: 'URL',
  headers: 'BAŞLIQLAR',
  statusCode: 'STATUS KODU',
  body: 'GÖVDƏ',
  shareEntry: 'Qeydi Paylaş',
  shareCurl: 'cURL Paylaş',
  closeMenu: 'Bağla',
  curlCommand: 'cURL Əmri',
  back: 'Geri',
  request: 'SORĞU',
  response: 'CAVAB',
  close: 'Bağla',
  exit: 'Çıxış',

  ms: 'ms',
  kb: 'kb',
  error: 'Xəta',

  login: 'Debug Girişi',
  passPlaceholder: 'Şifrəni daxil edin',
  cancel: 'Ləğv et',
  confirm: 'Təsdiqlə',
  wrongPass: 'Şifrə yanlışdır',
  clicks: (n) => `Ardıcıl ${n} klik aşkar edildi`,

  pleaseEnterUrl: 'Zəhmət olmasa URL daxil edin',
  urlMustStartWith: 'URL http:// və ya https:// ilə başlamalıdır',
  invalidDomainFormat:
    'Yanlış domen formatı. Nümunə: https://api.example.com və ya http://localhost',
  invalidUrlFormat:
    'Yanlış URL formatı. Zəhmət olmasa protokolu daxil edin (məs. https://api.example.com)',
  success: 'Uğurlu',
  newSourceApplied: 'Yeni mənbə tətbiq edildi',
  couldNotShareReport: 'Hesabatı paylaşmaq mümkün deyil',
  couldNotShareLog: 'Qeydi paylaşmaq mümkün deyil',
  couldNotShare: 'Paylaşmaq mümkün deyil',
  reportTitle: 'Şəbəkə Monitoru Hesabatı',
  logShareTitle: 'Şəbəkə Qeydi',

  logChipError: 'XƏTA',

  store: 'Mağaza',
  action: 'Fəaliyyət',
  state: 'Vəziyyət',
  prevState: 'Əvvəlki Vəziyyət',
  nextState: 'Növbəti Vəziyyət',
  diff: 'Fərq',
  snapshot: 'Şəkil',
  noStoreActivity: 'Vəziyyət dəyişikliyi qeydə alınmayıb',
  storeSubtitle: 'Vəziyyət dəyişiklikləri middleware vasitəsilə izlənilir',
  actionType: 'Fəaliyyət Növü',
  actionPayload: 'Fəaliyyət Yükü',
  changedKeys: 'Dəyişdirilmiş Açarlar',
  fullState: 'Tam Vəziyyət',
};

const ru: Translation = {
  monitor: 'Монитор',
  entries: (n) => `${n} ${n === 1 ? 'запись' : n < 5 ? 'записи' : 'записей'}`,

  debug: 'ДЕБАГ',

  all: 'Все',
  network: 'Сеть',
  logs: 'Логи',
  ws: 'WS',
  fps: 'FPS',
  settings: 'Настройки',

  search: 'Поиск...',
  allFilter: 'Все',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'Записи не найдены',
  emptySubtitle: 'Запросы будут отображаться здесь автоматически',

  deviceInfo: 'ИНФО УСТРОЙСТВА',
  advancedTools: 'ДОПОЛНИТЕЛЬНО',
  selectSource: 'ВЫБЕРИТЕ ИСТОЧНИК',
  manualEntry: 'РУЧНОЙ ВВОД',
  customUrl: 'ПОЛЬЗОВАТЕЛЬСКИЙ URL',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'ПРИМЕНИТЬ',
  shareJsonReport: 'ПОДЕЛИТЬСЯ JSON',
  shareTextReport: 'ПОДЕЛИТЬСЯ ТЕКСТОМ',
  saveJsonReportToFile: 'СОХРАНИТЬ JSON В ФАЙЛ',
  saveTextReportToFile: 'СОХРАНИТЬ ТЕКСТ В ФАЙЛ',
  wipeAllRecords: 'ОЧИСТИТЬ ВСЕ ЗАПИСИ',

  productionApi: 'ПРОДАКШН API (PROD)',
  testApi: 'ТЕСТ API (TEST)',
  productive: 'ПРОДАКШН (PROD)',
  demonstration: 'ДЕМО (DEMO)',
  unknown: 'Неизвестно',

  currentFps: 'ТЕКУЩИЙ FPS',
  averageFps: 'СРЕДНИЙ FPS',
  minFps: 'МИН. FPS',
  maxFps: 'МАКС. FPS',
  droppedFrames: 'ПРОПУЩЕНО КАДРОВ',
  fpsHistory: 'ИСТОРИЯ FPS (ПОСЛЕДНИЕ 60 СЕКУНД)',
  fpsMonitorActive: 'Мониторинг FPS активен',
  fpsMonitorOff: 'Мониторинг FPS выключен',
  fpsEmpty: 'Нажмите переключатель выше, чтобы начать мониторинг FPS',

  noWebSocketActivity: 'НЕТ АКТИВНОСТИ WEBSOCKET',
  wsSubtitle: 'WebSocket соединения перехватываются автоматически',
  wsOpen: 'ОТКРЫТ',
  wsClose: 'ЗАКРЫТ',
  wsError: 'ОШИБКА',
  wsMsg: 'СООБЩ',

  device: 'УСТРОЙСТВО',
  application: 'ПРИЛОЖЕНИЕ',
  platform: 'Платформа',
  model: 'Модель',
  screen: 'Экран',
  appVersion: 'Версия приложения',
  buildVersion: 'Версия сборки',

  consoleError: 'ОШИБКА КОНСОЛИ',
  logMessage: 'СООБЩЕНИЕ ЛОГА',
  websocketEvent: 'СОБЫТИЕ WEBSOCKET',
  performanceData: 'ДАННЫЕ ПРОИЗВОДИТЕЛЬНОСТИ',
  data: 'ДАННЫЕ',
  method: 'МЕТОД',
  url: 'URL',
  headers: 'ЗАГОЛОВКИ',
  statusCode: 'КОД СТАТУСА',
  body: 'ТЕЛО',
  shareEntry: 'Поделиться записью',
  shareCurl: 'Поделиться cURL',
  closeMenu: 'Закрыть',
  curlCommand: 'cURL команда',
  back: 'Назад',
  request: 'ЗАПРОС',
  response: 'ОТВЕТ',
  close: 'Закрыть',
  exit: 'Выход',

  ms: 'мс',
  kb: 'кб',
  error: 'Ошибка',

  login: 'Вход',
  passPlaceholder: 'Введите пароль',
  cancel: 'Отмена',
  confirm: 'Ок',
  wrongPass: 'Неверный пароль',
  clicks: (n) => `Обнаружено ${n} кликов`,

  pleaseEnterUrl: 'Пожалуйста, введите URL',
  urlMustStartWith: 'URL должен начинаться с http:// или https://',
  invalidDomainFormat:
    'Неверный формат домена. Пример: https://api.example.com или http://localhost',
  invalidUrlFormat:
    'Неверный формат URL. Укажите протокол (например, https://api.example.com)',
  success: 'Успешно',
  newSourceApplied: 'Новый источник применён',
  couldNotShareReport: 'Не удалось поделиться отчётом',
  couldNotShareLog: 'Не удалось поделиться записью',
  couldNotShare: 'Не удалось поделиться',
  reportTitle: 'Отчёт сетевого монитора',
  logShareTitle: 'Запись лога',

  logChipError: 'ОШИБКА',

  store: 'Стора',
  action: 'Действие',
  state: 'Состояние',
  prevState: 'Предыдущее Состояние',
  nextState: 'Следующее Состояние',
  diff: 'Разница',
  snapshot: 'Снимок',
  noStoreActivity: 'Изменения состояния не записаны',
  storeSubtitle: 'Изменения состояния отслеживаются через middleware',
  actionType: 'Тип Действия',
  actionPayload: 'Полезная Нагрузка',
  changedKeys: 'Изменённые Ключи',
  fullState: 'Полное Состояние',
};

const tr: Translation = {
  monitor: 'Monitör',
  entries: (n) => `${n} kayıt`,

  debug: 'DEBUG',

  all: 'Tümü',
  network: 'Ağ',
  logs: 'Loglar',
  ws: 'WS',
  fps: 'FPS',
  settings: 'Ayarlar',

  search: 'Ara...',
  allFilter: 'Tümü',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'Log bulunamadı',
  emptySubtitle: 'İstekler burada otomatik olarak görünecek',

  deviceInfo: 'CİHAZ BİLGİSİ',
  advancedTools: 'GELİŞMİŞ ARAÇLAR',
  selectSource: 'KAYNAK SEÇ',
  manualEntry: 'MANUEL GİRİŞ',
  customUrl: 'ÖZEL URL',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'DEĞİŞİKLİKLERİ UYGULA',
  shareJsonReport: 'JSON RAPORU PAYLAŞ',
  shareTextReport: 'METİN RAPORU PAYLAŞ',
  saveJsonReportToFile: 'JSON RAPORU DOSYAYA KAYDET',
  saveTextReportToFile: 'METİN RAPORU DOSYAYA KAYDET',
  wipeAllRecords: 'TÜM KAYITLARI SİL',

  productionApi: 'PRODÜKSİYON API (PROD)',
  testApi: 'TEST API (TEST)',
  productive: 'PRODÜKSİYON (PROD)',
  demonstration: 'GÖSTERİ (DEMO)',
  unknown: 'Bilinmiyor',

  currentFps: 'MEVCUT FPS',
  averageFps: 'ORTALAMA FPS',
  minFps: 'MİNİMUM FPS',
  maxFps: 'MAKSİMUM FPS',
  droppedFrames: 'DÜŞÜRÜLEN KARE',
  fpsHistory: 'FPS GEÇMİŞİ (SON 60 SANİYE)',
  fpsMonitorActive: 'FPS Monitörü Aktif',
  fpsMonitorOff: 'FPS Monitörü Kapalı',
  fpsEmpty: 'FPS izlemeye başlamak için yukarıdaki düğmeye dokunun',

  noWebSocketActivity: 'WEB SOCKET ETKİNLİĞİ YOK',
  wsSubtitle: 'WebSocket bağlantıları otomatik olarak yakalanır',
  wsOpen: 'AÇIK',
  wsClose: 'KAPALI',
  wsError: 'HATA',
  wsMsg: 'MSG',

  device: 'CİHAZ',
  application: 'UYGULAMA',
  platform: 'Platform',
  model: 'Model',
  screen: 'Ekran',
  appVersion: 'Uygulama Sürümü',
  buildVersion: 'Build Sürümü',

  consoleError: 'KONSOL HATASI',
  logMessage: 'LOG MESAJI',
  websocketEvent: 'WEBSOCKET OLAYI',
  performanceData: 'PERFORMANS VERİSİ',
  data: 'VERİ',
  method: 'METOT',
  url: 'URL',
  headers: 'BAŞLIKLAR',
  statusCode: 'DURUM KODU',
  body: 'GÖVDE',
  shareEntry: 'Kaydı Paylaş',
  shareCurl: 'cURL Paylaş',
  closeMenu: 'Kapat',
  curlCommand: 'cURL Komutu',
  back: 'Geri',
  request: 'İSTEK',
  response: 'YANIT',
  close: 'Kapat',
  exit: 'Çıkış',

  ms: 'ms',
  kb: 'kb',
  error: 'Hata',

  login: 'Giriş',
  passPlaceholder: 'Şifreyi giriniz',
  cancel: 'İptal',
  confirm: 'Onayla',
  wrongPass: 'Yanlış şifre',
  clicks: (n) => `${n} tıklama tespit edildi`,

  pleaseEnterUrl: 'Lütfen bir URL girin',
  urlMustStartWith: 'URL http:// veya https:// ile başlamalıdır',
  invalidDomainFormat:
    'Geçersiz alan adı formatı. Örnek: https://api.example.com veya http://localhost',
  invalidUrlFormat:
    'Geçersiz URL formatı. Lütfen protokolü ekleyin (örn. https://api.example.com)',
  success: 'Başarılı',
  newSourceApplied: 'Yeni kaynak uygulandı',
  couldNotShareReport: 'Rapor paylaşılamadı',
  couldNotShareLog: 'Log paylaşılamadı',
  couldNotShare: 'Paylaşılamadı',
  reportTitle: 'Ağ Monitörü Dışa Aktarım Raporu',
  logShareTitle: 'Log Kaydı',

  logChipError: 'HATA',

  store: 'Mağaza',
  action: 'Eylem',
  state: 'Durum',
  prevState: 'Önceki Durum',
  nextState: 'Sonraki Durum',
  diff: 'Fark',
  snapshot: 'Anlık Görüntü',
  noStoreActivity: 'Durum değişikliği kaydedilmedi',
  storeSubtitle: 'Durum değişiklikleri middleware ile izleniyor',
  actionType: 'Eylem Türü',
  actionPayload: 'Eylem Yükü',
  changedKeys: 'Değiştirilen Anahtarlar',
  fullState: 'Tam Durum',
};

const hi: Translation = {
  monitor: 'मॉनिटर',
  entries: (n) => `${n} प्रविष्टियाँ`,

  debug: 'डिबग',

  all: 'सभी',
  network: 'नेटवर्क',
  logs: 'लॉग्स',
  ws: 'WS',
  fps: 'FPS',
  settings: 'सेटिंग्स',

  search: 'खोजें...',
  allFilter: 'सभी',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'कोई लॉग नहीं मिला',
  emptySubtitle: 'अनुरोध यहाँ स्वचालित रूप से दिखाई देंगे',

  deviceInfo: 'डिवाइस जानकारी',
  advancedTools: 'उन्नत टूल्स',
  selectSource: 'स्रोत चुनें',
  manualEntry: 'मैन्युअल प्रविष्टि',
  customUrl: 'कस्टम URL',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'परिवर्तन लागू करें',
  shareJsonReport: 'JSON रिपोर्ट साझा करें',
  shareTextReport: 'टेक्स्ट रिपोर्ट साझा करें',
  saveJsonReportToFile: 'JSON रिपोर्ट फाइल में सहेजें',
  saveTextReportToFile: 'टेक्स्ट रिपोर्ट फाइल में सहेजें',
  wipeAllRecords: 'सभी रिकॉर्ड हटाएँ',

  productionApi: 'प्रोडक्शन API (PROD)',
  testApi: 'टेस्ट API (TEST)',
  productive: 'प्रोडक्शन (PROD)',
  demonstration: 'डेमो (DEMO)',
  unknown: 'अज्ञात',

  currentFps: 'वर्तमान FPS',
  averageFps: 'औसत FPS',
  minFps: 'न्यूनतम FPS',
  maxFps: 'अधिकतम FPS',
  droppedFrames: 'छूटे हुए फ्रेम',
  fpsHistory: 'FPS इतिहास (पिछले 60 सेकंड)',
  fpsMonitorActive: 'FPS मॉनिटर सक्रिय',
  fpsMonitorOff: 'FPS मॉनिटर बंद',
  fpsEmpty: 'FPS मॉनिटरिंग शुरू करने के लिए ऊपर टॉगल पर टैप करें',

  noWebSocketActivity: 'कोई WEBSOCKET गतिविधि नहीं',
  wsSubtitle: 'WebSocket कनेक्शन स्वचालित रूप से इंटरसेप्ट होते हैं',
  wsOpen: 'खुला',
  wsClose: 'बंद',
  wsError: 'त्रुटि',
  wsMsg: 'संदेश',

  device: 'डिवाइस',
  application: 'एप्लीकेशन',
  platform: 'प्लेटफ़ॉर्म',
  model: 'मॉडल',
  screen: 'स्क्रीन',
  appVersion: 'ऐप वर्शन',
  buildVersion: 'बिल्ड वर्शन',

  consoleError: 'कंसोल त्रुटि',
  logMessage: 'लॉग संदेश',
  websocketEvent: 'WEBSOCKET घटना',
  performanceData: 'प्रदर्शन डेटा',
  data: 'डेटा',
  method: 'विधि',
  url: 'URL',
  headers: 'हेडर',
  statusCode: 'स्थिति कोड',
  body: 'बॉडी',
  shareEntry: 'प्रविष्टि साझा करें',
  shareCurl: 'cURL साझा करें',
  closeMenu: 'बंद करें',
  curlCommand: 'cURL कमांड',
  back: 'वापस',
  request: 'अनुरोध',
  response: 'प्रतिक्रिया',
  close: 'बंद करें',
  exit: 'बाहर',

  ms: 'मि.से.',
  kb: 'कि.बा.',
  error: 'त्रुटि',

  login: 'डिबग लॉगिन',
  passPlaceholder: 'पासवर्ड दर्ज करें',
  cancel: 'रद्द करें',
  confirm: 'पुष्टि करें',
  wrongPass: 'गलत पासवर्ड',
  clicks: (n) => `${n} क्लिक मिले`,

  pleaseEnterUrl: 'कृपया एक URL दर्ज करें',
  urlMustStartWith: 'URL http:// या https:// से शुरू होना चाहिए',
  invalidDomainFormat:
    'अमान्य डोमेन प्रारूप। उदाहरण: https://api.example.com या http://localhost',
  invalidUrlFormat:
    'अमान्य URL प्रारूप। कृपया प्रोटोकॉल शामिल करें (जैसे https://api.example.com)',
  success: 'सफल',
  newSourceApplied: 'नया स्रोत लागू किया गया',
  couldNotShareReport: 'रिपोर्ट साझा नहीं की जा सकी',
  couldNotShareLog: 'लॉग साझा नहीं किया जा सका',
  couldNotShare: 'साझा नहीं किया जा सका',
  reportTitle: 'नेटवर्क मॉनिटर निर्यात रिपोर्ट',
  logShareTitle: 'लॉग प्रविष्टि',

  logChipError: 'त्रुटि',

  store: 'स्टोर',
  action: 'कार्रवाई',
  state: 'अवस्था',
  prevState: 'पिछली अवस्था',
  nextState: 'अगली अवस्था',
  diff: 'अंतर',
  snapshot: 'स्नैपशॉट',
  noStoreActivity: 'कोई अवस्था परिवर्तन दर्ज नहीं किया गया',
  storeSubtitle: 'अवस्था परिवर्तन middleware द्वारा ट्रैक किए जाते हैं',
  actionType: 'कार्रवाई प्रकार',
  actionPayload: 'कार्रवाई पेलोड',
  changedKeys: 'बदली गई कुंजियाँ',
  fullState: 'पूर्ण अवस्था',
};

const gu: Translation = {
  monitor: 'મોનિટર',
  entries: (n) => `${n} એન્ટ્રી`,

  debug: 'ડિબગ',

  all: 'બધા',
  network: 'નેટવર્ક',
  logs: 'લોગ્સ',
  ws: 'WS',
  fps: 'FPS',
  settings: 'સેટિંગ્સ',

  search: 'શોધો...',
  allFilter: 'બધા',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'કોઈ લોગ મળ્યો નથી',
  emptySubtitle: 'વિનંતીઓ અહીં આપોઆપ દેખાશે',

  deviceInfo: 'ડિવાઇસ માહિતી',
  advancedTools: 'અદ્યતન સાધનો',
  selectSource: 'સ્ત્રોત પસંદ કરો',
  manualEntry: 'મેન્યુઅલ એન્ટ્રી',
  customUrl: 'કસ્ટમ URL',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'ફેરફારો લાગુ કરો',
  shareJsonReport: 'JSON રિપોર્ટ શેર કરો',
  shareTextReport: 'ટેક્સ્ટ રિપોર્ટ શેર કરો',
  saveJsonReportToFile: 'JSON રિપોર્ટ ફાઇલમાં સાચવો',
  saveTextReportToFile: 'ટેક્સ્ટ રિપોર્ટ ફાઇલમાં સાચવો',
  wipeAllRecords: 'બધી રેકોર્ડ્સ કાઢી નાખો',

  productionApi: 'પ્રોડક્શન API (PROD)',
  testApi: 'ટેસ્ટ API (TEST)',
  productive: 'પ્રોડક્શન (PROD)',
  demonstration: 'ડેમો (DEMO)',
  unknown: 'અજાણ',

  currentFps: 'વર્તમાન FPS',
  averageFps: 'સરેરાશ FPS',
  minFps: 'લઘુત્તમ FPS',
  maxFps: 'મહત્તમ FPS',
  droppedFrames: 'છૂટેલા ફ્રેમ્સ',
  fpsHistory: 'FPS ઇતિહાસ (છેલ્લા 60 સેકન્ડ)',
  fpsMonitorActive: 'FPS મોનિટર સક્રિય',
  fpsMonitorOff: 'FPS મોનિટર બંધ',
  fpsEmpty: 'FPS મોનિટરિંગ શરૂ કરવા ઉપરના ટોગલ પર ટેપ કરો',

  noWebSocketActivity: 'કોઈ WEBSOCKET પ્રવૃત્તિ નથી',
  wsSubtitle: 'WebSocket કનેક્શન આપોઆપ ઇન્ટરસેપ્ટ થાય છે',
  wsOpen: 'ખુલ્લું',
  wsClose: 'બંધ',
  wsError: 'ભૂલ',
  wsMsg: 'સંદેશ',

  device: 'ડિવાઇસ',
  application: 'એપ્લિકેશન',
  platform: 'પ્લેટફોર્મ',
  model: 'મોડેલ',
  screen: 'સ્ક્રીન',
  appVersion: 'એપ્સ વર્ઝન',
  buildVersion: 'બિલ્ડ વર્ઝન',

  consoleError: 'કન્સોલ ભૂલ',
  logMessage: 'લોગ સંદેશ',
  websocketEvent: 'WEBSOCKET ઘટના',
  performanceData: 'પ્રદર્શન ડેટા',
  data: 'ડેટા',
  method: 'પદ્ધતિ',
  url: 'URL',
  headers: 'હેડર્સ',
  statusCode: 'સ્ટેટસ કોડ',
  body: 'બોડી',
  shareEntry: 'એન્ટ્રી શેર કરો',
  shareCurl: 'cURL શેર કરો',
  closeMenu: 'બંધ કરો',
  curlCommand: 'cURL આદેશ',
  back: 'પાછળ',
  request: 'વિનંતી',
  response: 'પ્રતિસાદ',
  close: 'બંધ કરો',
  exit: 'બહાર',

  ms: 'મિ.સે.',
  kb: 'કિ.બા.',
  error: 'ભૂલ',

  login: 'ડિબગ લોગિન',
  passPlaceholder: 'પાસવર્ડ દાખલ કરો',
  cancel: 'રદ કરો',
  confirm: 'પુષ્ટિ કરો',
  wrongPass: 'ખોટો પાસવર્ડ',
  clicks: (n) => `${n} ક્લિક મળ્યા`,

  pleaseEnterUrl: 'કૃપા કરી URL દાખલ કરો',
  urlMustStartWith: 'URL http:// અથવા https:// થી શરૂ થવો જોઈએ',
  invalidDomainFormat:
    'અમાન્ય ડોમેન ફોર્મેટ. ઉદાહરણ: https://api.example.com અથવા http://localhost',
  invalidUrlFormat:
    'અમાન્ય URL ફોર્મેટ. કૃપા કરી પ્રોટોકોલ શામેલ કરો (દા.ત. https://api.example.com)',
  success: 'સફળ',
  newSourceApplied: 'નવો સ્ત્રોત લાગુ કર્યો',
  couldNotShareReport: 'રિપોર્ટ શેર કરી શકાઈ નથી',
  couldNotShareLog: 'લોગ શેર કરી શકાયો નથી',
  couldNotShare: 'શેર કરી શકાયું નથી',
  reportTitle: 'નેટવર્ક મોનિટર એક્સપોર્ટ રિપોર્ટ',
  logShareTitle: 'લોગ એન્ટ્રી',

  logChipError: 'ભૂલ',

  store: 'સ્ટોર',
  action: 'ક્રિયા',
  state: 'સ્થિતિ',
  prevState: 'અગાઉની સ્થિતિ',
  nextState: 'આગામી સ્થિતિ',
  diff: 'તફાવત',
  snapshot: 'સ્નેપશોટ',
  noStoreActivity: 'કોઈ સ્થિતિ ફેરફાર નોંધાયો નથી',
  storeSubtitle: 'સ્થિતિ ફેરફારો middleware દ્વારા ટ્રૅક થાય છે',
  actionType: 'ક્રિયા પ્રકાર',
  actionPayload: 'ક્રિયા પેલોડ',
  changedKeys: 'બદલાયેલ કીઝ',
  fullState: 'સંપૂર્ણ સ્થિતિ',
};

const es: Translation = {
  monitor: 'Monitor',
  entries: (n) => `${n} ${n === 1 ? 'entrada' : 'entradas'}`,

  debug: 'DEBUG',

  all: 'Todo',
  network: 'Red',
  logs: 'Registros',
  ws: 'WS',
  fps: 'FPS',
  settings: 'Ajustes',

  search: 'Buscar...',
  allFilter: 'Todo',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'No se encontraron registros',
  emptySubtitle: 'Las solicitudes aparecerán aquí automáticamente',

  deviceInfo: 'INFO DEL DISPOSITIVO',
  advancedTools: 'HERRAMIENTAS AVANZADAS',
  selectSource: 'SELECCIONAR ORIGEN',
  manualEntry: 'ENTRADA MANUAL',
  customUrl: 'URL PERSONALIZADA',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'APLICAR CAMBIOS',
  shareJsonReport: 'COMPARTIR INFORME JSON',
  shareTextReport: 'COMPARTIR INFORME DE TEXTO',
  saveJsonReportToFile: 'GUARDAR JSON EN ARCHIVO',
  saveTextReportToFile: 'GUARDAR TEXTO EN ARCHIVO',
  wipeAllRecords: 'ELIMINAR TODOS LOS REGISTROS',

  productionApi: 'API DE PRODUCCIÓN (PROD)',
  testApi: 'API DE PRUEBAS (TEST)',
  productive: 'PRODUCTIVO (PROD)',
  demonstration: 'DEMOSTRACIÓN (DEMO)',
  unknown: 'Desconocido',

  currentFps: 'FPS ACTUAL',
  averageFps: 'FPS PROMEDIO',
  minFps: 'FPS MÍNIMO',
  maxFps: 'FPS MÁXIMO',
  droppedFrames: 'FOTOGRAMAS PERDIDOS',
  fpsHistory: 'HISTORIAL DE FPS (ÚLTIMOS 60 SEGUNDOS)',
  fpsMonitorActive: 'Monitor FPS activo',
  fpsMonitorOff: 'Monitor FPS apagado',
  fpsEmpty: 'Toca el interruptor para empezar a monitorear FPS',

  noWebSocketActivity: 'SIN ACTIVIDAD WEBSOCKET',
  wsSubtitle: 'Las conexiones WebSocket se interceptan automáticamente',
  wsOpen: 'ABIERTO',
  wsClose: 'CERRADO',
  wsError: 'ERROR',
  wsMsg: 'MSG',

  device: 'DISPOSITIVO',
  application: 'APLICACIÓN',
  platform: 'Plataforma',
  model: 'Modelo',
  screen: 'Pantalla',
  appVersion: 'Versión de la app',
  buildVersion: 'Versión de compilación',

  consoleError: 'ERROR DE CONSOLA',
  logMessage: 'MENSAJE DE REGISTRO',
  websocketEvent: 'EVENTO WEBSOCKET',
  performanceData: 'DATOS DE RENDIMIENTO',
  data: 'DATOS',
  method: 'MÉTODO',
  url: 'URL',
  headers: 'ENCABEZADOS',
  statusCode: 'CÓDIGO DE ESTADO',
  body: 'CUERPO',
  shareEntry: 'Compartir entrada',
  shareCurl: 'Compartir cURL',
  closeMenu: 'Cerrar',
  curlCommand: 'Comando cURL',
  back: 'Atrás',
  request: 'SOLICITUD',
  response: 'RESPUESTA',
  close: 'Cerrar',
  exit: 'Salir',

  ms: 'ms',
  kb: 'kb',
  error: 'Error',

  login: 'Acceso de depuración',
  passPlaceholder: 'Introduce la contraseña',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  wrongPass: 'Contraseña incorrecta',
  clicks: (n) => `${n} clics detectados`,

  pleaseEnterUrl: 'Por favor, introduce una URL',
  urlMustStartWith: 'La URL debe comenzar con http:// o https://',
  invalidDomainFormat:
    'Formato de dominio inválido. Ejemplo: https://api.example.com o http://localhost',
  invalidUrlFormat:
    'Formato de URL inválido. Incluye el protocolo (por ejemplo, https://api.example.com)',
  success: 'Éxito',
  newSourceApplied: 'Nuevo origen aplicado',
  couldNotShareReport: 'No se pudo compartir el informe',
  couldNotShareLog: 'No se pudo compartir el registro',
  couldNotShare: 'No se pudo compartir',
  reportTitle: 'Informe de monitor de red',
  logShareTitle: 'Entrada de registro',

  logChipError: 'ERROR',

  store: 'Tienda',
  action: 'Acción',
  state: 'Estado',
  prevState: 'Estado Anterior',
  nextState: 'Estado Siguiente',
  diff: 'Diferencia',
  snapshot: 'Instantánea',
  noStoreActivity: 'No se registraron cambios de estado',
  storeSubtitle: 'Cambios de estado monitorizados mediante middleware',
  actionType: 'Tipo de Acción',
  actionPayload: 'Carga de Acción',
  changedKeys: 'Claves Cambiadas',
  fullState: 'Estado Completo',
};

const fr: Translation = {
  monitor: 'Moniteur',
  entries: (n) => `${n} ${n === 1 ? 'entrée' : 'entrées'}`,

  debug: 'DEBUG',

  all: 'Tout',
  network: 'Réseau',
  logs: 'Journaux',
  ws: 'WS',
  fps: 'FPS',
  settings: 'Paramètres',

  search: 'Rechercher...',
  allFilter: 'Tout',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'Aucun journal trouvé',
  emptySubtitle: 'Les requêtes apparaîtront ici automatiquement',

  deviceInfo: 'INFOS APPAREIL',
  advancedTools: 'OUTILS AVANCÉS',
  selectSource: 'SÉLECTIONNER LA SOURCE',
  manualEntry: 'SAISIE MANUELLE',
  customUrl: 'URL PERSONNALISÉE',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'APPLIQUER',
  shareJsonReport: 'PARTAGER RAPPORT JSON',
  shareTextReport: 'PARTAGER RAPPORT TEXTE',
  saveJsonReportToFile: 'ENREGISTRER JSON DANS FICHIER',
  saveTextReportToFile: 'ENREGISTRER TEXTE DANS FICHIER',
  wipeAllRecords: 'EFFACER TOUS LES ENREGISTREMENTS',

  productionApi: 'API PRODUCTION (PROD)',
  testApi: 'API TEST (TEST)',
  productive: 'PRODUCTION (PROD)',
  demonstration: 'DÉMONSTRATION (DEMO)',
  unknown: 'Inconnu',

  currentFps: 'FPS ACTUEL',
  averageFps: 'FPS MOYEN',
  minFps: 'FPS MIN',
  maxFps: 'FPS MAX',
  droppedFrames: 'IMAGES PERDUES',
  fpsHistory: 'HISTORIQUE FPS (60 DERNIÈRES SECONDES)',
  fpsMonitorActive: 'Moniteur FPS actif',
  fpsMonitorOff: 'Moniteur FPS désactivé',
  fpsEmpty: 'Appuyez sur le bouton pour démarrer la surveillance FPS',

  noWebSocketActivity: 'AUCUNE ACTIVITÉ WEBSOCKET',
  wsSubtitle: 'Les connexions WebSocket sont interceptées automatiquement',
  wsOpen: 'OUVERT',
  wsClose: 'FERMÉ',
  wsError: 'ERREUR',
  wsMsg: 'MSG',

  device: 'APPAREIL',
  application: 'APPLICATION',
  platform: 'Plateforme',
  model: 'Modèle',
  screen: 'Écran',
  appVersion: 'Version de l\'app',
  buildVersion: 'Version du build',

  consoleError: 'ERREUR CONSOLE',
  logMessage: 'MESSAGE DU JOURNAL',
  websocketEvent: 'ÉVÉNEMENT WEBSOCKET',
  performanceData: 'DONNÉES DE PERFORMANCE',
  data: 'DONNÉES',
  method: 'MÉTHODE',
  url: 'URL',
  headers: 'EN-TÊTES',
  statusCode: 'CODE D\'ÉTAT',
  body: 'CORPS',
  shareEntry: 'Partager l\'entrée',
  shareCurl: 'Partager cURL',
  closeMenu: 'Fermer',
  curlCommand: 'Commande cURL',
  back: 'Retour',
  request: 'REQUÊTE',
  response: 'RÉPONSE',
  close: 'Fermer',
  exit: 'Quitter',

  ms: 'ms',
  kb: 'ko',
  error: 'Erreur',

  login: 'Connexion debug',
  passPlaceholder: 'Entrez le mot de passe',
  cancel: 'Annuler',
  confirm: 'Confirmer',
  wrongPass: 'Mot de passe incorrect',
  clicks: (n) => `${n} clics détectés`,

  pleaseEnterUrl: 'Veuillez saisir une URL',
  urlMustStartWith: 'L\'URL doit commencer par http:// ou https://',
  invalidDomainFormat:
    'Format de domaine invalide. Exemple : https://api.example.com ou http://localhost',
  invalidUrlFormat:
    'Format d\'URL invalide. Veuillez inclure le protocole (ex. https://api.example.com)',
  success: 'Succès',
  newSourceApplied: 'Nouvelle source appliquée',
  couldNotShareReport: 'Impossible de partager le rapport',
  couldNotShareLog: 'Impossible de partager le journal',
  couldNotShare: 'Impossible de partager',
  reportTitle: 'Rapport d\'export du moniteur réseau',
  logShareTitle: 'Entrée du journal',

  logChipError: 'ERREUR',

  store: 'Magasin',
  action: 'Action',
  state: 'État',
  prevState: 'État Précédent',
  nextState: 'État Suivant',
  diff: 'Différence',
  snapshot: 'Instantané',
  noStoreActivity: 'Aucun changement d\'état enregistré',
  storeSubtitle: 'Changements d\'état suivis via middleware',
  actionType: 'Type d\'Action',
  actionPayload: 'Charge de l\'Action',
  changedKeys: 'Clés Modifiées',
  fullState: 'État Complet',
};

const de: Translation = {
  monitor: 'Monitor',
  entries: (n) => `${n} ${n === 1 ? 'Eintrag' : 'Einträge'}`,

  debug: 'DEBUG',

  all: 'Alle',
  network: 'Netzwerk',
  logs: 'Protokolle',
  ws: 'WS',
  fps: 'FPS',
  settings: 'Einstellungen',

  search: 'Suchen...',
  allFilter: 'Alle',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'Keine Protokolle gefunden',
  emptySubtitle: 'Anfragen erscheinen hier automatisch',

  deviceInfo: 'GERÄTEINFO',
  advancedTools: 'ERWEITERTE WERKZEUGE',
  selectSource: 'QUELLE WÄHLEN',
  manualEntry: 'MANUELLE EINGABE',
  customUrl: 'EIGENE URL',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'ÄNDERUNGEN ANWENDEN',
  shareJsonReport: 'JSON-BERICHT TEILEN',
  shareTextReport: 'TEXT-BERICHT TEILEN',
  saveJsonReportToFile: 'JSON IN DATEI SPEICHERN',
  saveTextReportToFile: 'TEXT IN DATEI SPEICHERN',
  wipeAllRecords: 'ALLE AUFZEICHNUNGEN LÖSCHEN',

  productionApi: 'PRODUKTION-API (PROD)',
  testApi: 'TEST-API (TEST)',
  productive: 'PRODUKTION (PROD)',
  demonstration: 'DEMO (DEMO)',
  unknown: 'Unbekannt',

  currentFps: 'AKTUELLE FPS',
  averageFps: 'DURCHSCHNITTLICHE FPS',
  minFps: 'MIN FPS',
  maxFps: 'MAX FPS',
  droppedFrames: 'VERLORENE BILDER',
  fpsHistory: 'FPS-VERLAUF (LETZTE 60 SEKUNDEN)',
  fpsMonitorActive: 'FPS-Monitor aktiv',
  fpsMonitorOff: 'FPS-Monitor aus',
  fpsEmpty: 'Tippe auf den Schalter, um die FPS-Überwachung zu starten',

  noWebSocketActivity: 'KEINE WEBSOCKET-AKTIVITÄT',
  wsSubtitle: 'WebSocket-Verbindungen werden automatisch abgefangen',
  wsOpen: 'OFFEN',
  wsClose: 'GESCHLOSSEN',
  wsError: 'FEHLER',
  wsMsg: 'MSG',

  device: 'GERÄT',
  application: 'ANWENDUNG',
  platform: 'Plattform',
  model: 'Modell',
  screen: 'Bildschirm',
  appVersion: 'App-Version',
  buildVersion: 'Build-Version',

  consoleError: 'KONSOLENFEHLER',
  logMessage: 'PROTOKOLLNACHRICHT',
  websocketEvent: 'WEBSOCKET-EREIGNIS',
  performanceData: 'LEISTUNGSDATEN',
  data: 'DATEN',
  method: 'METHODE',
  url: 'URL',
  headers: 'KOPFZEILEN',
  statusCode: 'STATUSCODE',
  body: 'INHALT',
  shareEntry: 'Eintrag teilen',
  shareCurl: 'cURL teilen',
  closeMenu: 'Schließen',
  curlCommand: 'cURL-Befehl',
  back: 'Zurück',
  request: 'ANFRAGE',
  response: 'ANTWORT',
  close: 'Schließen',
  exit: 'Beenden',

  ms: 'ms',
  kb: 'KB',
  error: 'Fehler',

  login: 'Debug-Anmeldung',
  passPlaceholder: 'Passwort eingeben',
  cancel: 'Abbrechen',
  confirm: 'Bestätigen',
  wrongPass: 'Falsches Passwort',
  clicks: (n) => `${n} Klicks erkannt`,

  pleaseEnterUrl: 'Bitte eine URL eingeben',
  urlMustStartWith: 'URL muss mit http:// oder https:// beginnen',
  invalidDomainFormat:
    'Ungültiges Domain-Format. Beispiel: https://api.example.com oder http://localhost',
  invalidUrlFormat:
    'Ungültiges URL-Format. Bitte Protokoll angeben (z. B. https://api.example.com)',
  success: 'Erfolg',
  newSourceApplied: 'Neue Quelle angewendet',
  couldNotShareReport: 'Bericht konnte nicht geteilt werden',
  couldNotShareLog: 'Protokoll konnte nicht geteilt werden',
  couldNotShare: 'Teilen nicht möglich',
  reportTitle: 'Netzwerk-Monitor-Exportbericht',
  logShareTitle: 'Protokolleintrag',

  logChipError: 'FEHLER',

  store: 'Store',
  action: 'Aktion',
  state: 'Zustand',
  prevState: 'Vorheriger Zustand',
  nextState: 'Nächster Zustand',
  diff: 'Unterschied',
  snapshot: 'Schnappschuss',
  noStoreActivity: 'Keine Zustandsänderungen aufgezeichnet',
  storeSubtitle: 'Zustandsänderungen werden per Middleware verfolgt',
  actionType: 'Aktionstyp',
  actionPayload: 'Aktionsnutzlast',
  changedKeys: 'Geänderte Schlüssel',
  fullState: 'Vollständiger Zustand',
};

const ar: Translation = {
  monitor: 'الشاشة',
  entries: (n) => `${n} ${n === 1 ? 'إدخال' : 'إدخالات'}`,

  debug: 'تصحيح',

  all: 'الكل',
  network: 'الشبكة',
  logs: 'السجلات',
  ws: 'WS',
  fps: 'FPS',
  settings: 'الإعدادات',

  search: 'بحث...',
  allFilter: 'الكل',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'لا توجد سجلات',
  emptySubtitle: 'ستظهر الطلبات هنا تلقائيًا',

  deviceInfo: 'معلومات الجهاز',
  advancedTools: 'أدوات متقدمة',
  selectSource: 'اختر المصدر',
  manualEntry: 'إدخال يدوي',
  customUrl: 'رابط مخصص',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'تطبيق التغييرات',
  shareJsonReport: 'مشاركة تقرير JSON',
  shareTextReport: 'مشاركة تقرير نصي',
  saveJsonReportToFile: 'حفظ JSON في ملف',
  saveTextReportToFile: 'حفظ النص في ملف',
  wipeAllRecords: 'مسح جميع السجلات',

  productionApi: 'API الإنتاج (PROD)',
  testApi: 'API الاختبار (TEST)',
  productive: 'إنتاج (PROD)',
  demonstration: 'عرض توضيحي (DEMO)',
  unknown: 'غير معروف',

  currentFps: 'FPS الحالي',
  averageFps: 'FPS المتوسط',
  minFps: 'أقل FPS',
  maxFps: 'أعلى FPS',
  droppedFrames: 'الإطارات المفقودة',
  fpsHistory: 'سجل FPS (آخر 60 ثانية)',
  fpsMonitorActive: 'مراقب FPS نشط',
  fpsMonitorOff: 'مراقب FPS متوقف',
  fpsEmpty: 'اضغط على المفتاح لبدء مراقبة FPS',

  noWebSocketActivity: 'لا يوجد نشاط WEBSOCKET',
  wsSubtitle: 'يتم اعتراض اتصالات WebSocket تلقائيًا',
  wsOpen: 'مفتوح',
  wsClose: 'مغلق',
  wsError: 'خطأ',
  wsMsg: 'رسالة',

  device: 'الجهاز',
  application: 'التطبيق',
  platform: 'النظام',
  model: 'الطراز',
  screen: 'الشاشة',
  appVersion: 'إصدار التطبيق',
  buildVersion: 'إصدار البناء',

  consoleError: 'خطأ في الكونسول',
  logMessage: 'رسالة السجل',
  websocketEvent: 'حدث WEBSOCKET',
  performanceData: 'بيانات الأداء',
  data: 'البيانات',
  method: 'الطريقة',
  url: 'الرابط',
  headers: 'الترويسات',
  statusCode: 'رمز الحالة',
  body: 'المحتوى',
  shareEntry: 'مشاركة الإدخال',
  shareCurl: 'مشاركة cURL',
  closeMenu: 'إغلاق',
  curlCommand: 'أمر cURL',
  back: 'رجوع',
  request: 'طلب',
  response: 'استجابة',
  close: 'إغلاق',
  exit: 'خروج',

  ms: 'م.ث',
  kb: 'ك.ب',
  error: 'خطأ',

  login: 'تسجيل دخول التصحيح',
  passPlaceholder: 'أدخل كلمة المرور',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  wrongPass: 'كلمة مرور خاطئة',
  clicks: (n) => `تم اكتشاف ${n} نقرات`,

  pleaseEnterUrl: 'الرجاء إدخال رابط',
  urlMustStartWith: 'يجب أن يبدأ الرابط بـ http:// أو https://',
  invalidDomainFormat:
    'تنسيق النطاق غير صالح. مثال: https://api.example.com أو http://localhost',
  invalidUrlFormat:
    'تنسيق الرابط غير صالح. يرجى تضمين البروتوكول (مثل https://api.example.com)',
  success: 'نجاح',
  newSourceApplied: 'تم تطبيق المصدر الجديد',
  couldNotShareReport: 'تعذر مشاركة التقرير',
  couldNotShareLog: 'تعذر مشاركة السجل',
  couldNotShare: 'تعذر المشاركة',
  reportTitle: 'تقرير تصدير مراقب الشبكة',
  logShareTitle: 'إدخال السجل',

  logChipError: 'خطأ',

  store: 'المتجر',
  action: 'إجراء',
  state: 'الحالة',
  prevState: 'الحالة السابقة',
  nextState: 'الحالة التالية',
  diff: 'الفرق',
  snapshot: 'لقطة',
  noStoreActivity: 'لم يتم تسجيل أي تغييرات في الحالة',
  storeSubtitle: 'تتبع تغييرات الحالة عبر الوسيطة',
  actionType: 'نوع الإجراء',
  actionPayload: 'حمولة الإجراء',
  changedKeys: 'المفاتيح المتغيرة',
  fullState: 'الحالة الكاملة',
};

const zh: Translation = {
  monitor: '监控',
  entries: (n) => `${n} 条记录`,

  debug: '调试',

  all: '全部',
  network: '网络',
  logs: '日志',
  ws: 'WS',
  fps: 'FPS',
  settings: '设置',

  search: '搜索...',
  allFilter: '全部',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: '暂无日志',
  emptySubtitle: '请求将自动显示在此处',

  deviceInfo: '设备信息',
  advancedTools: '高级工具',
  selectSource: '选择来源',
  manualEntry: '手动输入',
  customUrl: '自定义 URL',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: '应用更改',
  shareJsonReport: '分享 JSON 报告',
  shareTextReport: '分享文本报告',
  saveJsonReportToFile: '将 JSON 保存到文件',
  saveTextReportToFile: '将文本保存到文件',
  wipeAllRecords: '清除所有记录',

  productionApi: '生产环境 API (PROD)',
  testApi: '测试环境 API (TEST)',
  productive: '生产 (PROD)',
  demonstration: '演示 (DEMO)',
  unknown: '未知',

  currentFps: '当前 FPS',
  averageFps: '平均 FPS',
  minFps: '最低 FPS',
  maxFps: '最高 FPS',
  droppedFrames: '掉帧数',
  fpsHistory: 'FPS 历史（最近 60 秒）',
  fpsMonitorActive: 'FPS 监控已开启',
  fpsMonitorOff: 'FPS 监控已关闭',
  fpsEmpty: '点击上方开关以开始监控 FPS',

  noWebSocketActivity: '无 WEBSOCKET 活动',
  wsSubtitle: 'WebSocket 连接会被自动拦截',
  wsOpen: '已连接',
  wsClose: '已关闭',
  wsError: '错误',
  wsMsg: '消息',

  device: '设备',
  application: '应用',
  platform: '平台',
  model: '型号',
  screen: '屏幕',
  appVersion: '应用版本',
  buildVersion: '构建版本',

  consoleError: '控制台错误',
  logMessage: '日志消息',
  websocketEvent: 'WEBSOCKET 事件',
  performanceData: '性能数据',
  data: '数据',
  method: '方法',
  url: 'URL',
  headers: '请求头',
  statusCode: '状态码',
  body: '正文',
  shareEntry: '分享记录',
  shareCurl: '分享 cURL',
  closeMenu: '关闭',
  curlCommand: 'cURL 命令',
  back: '返回',
  request: '请求',
  response: '响应',
  close: '关闭',
  exit: '退出',

  ms: '毫秒',
  kb: 'KB',
  error: '错误',

  login: '调试登录',
  passPlaceholder: '输入密码',
  cancel: '取消',
  confirm: '确认',
  wrongPass: '密码错误',
  clicks: (n) => `检测到 ${n} 次点击`,

  pleaseEnterUrl: '请输入 URL',
  urlMustStartWith: 'URL 必须以 http:// 或 https:// 开头',
  invalidDomainFormat: '域名格式无效。示例：https://api.example.com 或 http://localhost',
  invalidUrlFormat: 'URL 格式无效。请包含协议（例如 https://api.example.com）',
  success: '成功',
  newSourceApplied: '已应用新来源',
  couldNotShareReport: '无法分享报告',
  couldNotShareLog: '无法分享日志',
  couldNotShare: '无法分享',
  reportTitle: '网络监控导出报告',
  logShareTitle: '日志记录',

  logChipError: '错误',

  store: '存储',
  action: '动作',
  state: '状态',
  prevState: '上一个状态',
  nextState: '下一个状态',
  diff: '差异',
  snapshot: '快照',
  noStoreActivity: '未记录状态更改',
  storeSubtitle: '状态更改通过中间件跟踪',
  actionType: '动作类型',
  actionPayload: '动作载荷',
  changedKeys: '更改的键',
  fullState: '完整状态',
};

const pt: Translation = {
  monitor: 'Monitor',
  entries: (n) => `${n} ${n === 1 ? 'entrada' : 'entradas'}`,

  debug: 'DEBUG',

  all: 'Tudo',
  network: 'Rede',
  logs: 'Registros',
  ws: 'WS',
  fps: 'FPS',
  settings: 'Ajustes',

  search: 'Buscar...',
  allFilter: 'Tudo',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'Nenhum registro encontrado',
  emptySubtitle: 'As requisições aparecerão aqui automaticamente',

  deviceInfo: 'INFO DO DISPOSITIVO',
  advancedTools: 'FERRAMENTAS AVANÇADAS',
  selectSource: 'SELECIONAR FONTE',
  manualEntry: 'ENTRADA MANUAL',
  customUrl: 'URL PERSONALIZADA',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: 'APLICAR ALTERAÇÕES',
  shareJsonReport: 'COMPARTILHAR RELATÓRIO JSON',
  shareTextReport: 'COMPARTILHAR RELATÓRIO TEXTO',
  saveJsonReportToFile: 'SALVAR JSON EM ARQUIVO',
  saveTextReportToFile: 'SALVAR TEXTO EM ARQUIVO',
  wipeAllRecords: 'APAGAR TODOS OS REGISTROS',

  productionApi: 'API DE PRODUÇÃO (PROD)',
  testApi: 'API DE TESTES (TEST)',
  productive: 'PRODUÇÃO (PROD)',
  demonstration: 'DEMONSTRAÇÃO (DEMO)',
  unknown: 'Desconhecido',

  currentFps: 'FPS ATUAL',
  averageFps: 'FPS MÉDIO',
  minFps: 'FPS MÍNIMO',
  maxFps: 'FPS MÁXIMO',
  droppedFrames: 'QUADROS PERDIDOS',
  fpsHistory: 'HISTÓRICO DE FPS (ÚLTIMOS 60 SEGUNDOS)',
  fpsMonitorActive: 'Monitor FPS ativo',
  fpsMonitorOff: 'Monitor FPS desligado',
  fpsEmpty: 'Toque no botão para iniciar o monitoramento de FPS',

  noWebSocketActivity: 'SEM ATIVIDADE WEBSOCKET',
  wsSubtitle: 'Conexões WebSocket são interceptadas automaticamente',
  wsOpen: 'ABERTO',
  wsClose: 'FECHADO',
  wsError: 'ERRO',
  wsMsg: 'MSG',

  device: 'DISPOSITIVO',
  application: 'APLICATIVO',
  platform: 'Plataforma',
  model: 'Modelo',
  screen: 'Tela',
  appVersion: 'Versão do app',
  buildVersion: 'Versão do build',

  consoleError: 'ERRO DE CONSOLE',
  logMessage: 'MENSAGEM DE REGISTRO',
  websocketEvent: 'EVENTO WEBSOCKET',
  performanceData: 'DADOS DE DESEMPENHO',
  data: 'DADOS',
  method: 'MÉTODO',
  url: 'URL',
  headers: 'CABEÇALHOS',
  statusCode: 'CÓDIGO DE STATUS',
  body: 'CORPO',
  shareEntry: 'Compartilhar entrada',
  shareCurl: 'Compartilhar cURL',
  closeMenu: 'Fechar',
  curlCommand: 'Comando cURL',
  back: 'Voltar',
  request: 'REQUISIÇÃO',
  response: 'RESPOSTA',
  close: 'Fechar',
  exit: 'Sair',

  ms: 'ms',
  kb: 'kb',
  error: 'Erro',

  login: 'Login de depuração',
  passPlaceholder: 'Digite a senha',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  wrongPass: 'Senha incorreta',
  clicks: (n) => `${n} cliques detectados`,

  pleaseEnterUrl: 'Por favor, insira uma URL',
  urlMustStartWith: 'A URL deve começar com http:// ou https://',
  invalidDomainFormat:
    'Formato de domínio inválido. Exemplo: https://api.example.com ou http://localhost',
  invalidUrlFormat:
    'Formato de URL inválido. Inclua o protocolo (por exemplo, https://api.example.com)',
  success: 'Sucesso',
  newSourceApplied: 'Nova fonte aplicada',
  couldNotShareReport: 'Não foi possível compartilhar o relatório',
  couldNotShareLog: 'Não foi possível compartilhar o registro',
  couldNotShare: 'Não foi possível compartilhar',
  reportTitle: 'Relatório de exportação do monitor de rede',
  logShareTitle: 'Entrada de registro',

  logChipError: 'ERRO',

  store: 'Armazenamento',
  action: 'Ação',
  state: 'Estado',
  prevState: 'Estado Anterior',
  nextState: 'Próximo Estado',
  diff: 'Diferença',
  snapshot: 'Instantâneo',
  noStoreActivity: 'Nenhuma mudança de estado registrada',
  storeSubtitle: 'Mudanças de estado rastreadas via middleware',
  actionType: 'Tipo de Ação',
  actionPayload: 'Carga da Ação',
  changedKeys: 'Chaves Alteradas',
  fullState: 'Estado Completo',
};

const ja: Translation = {
  monitor: 'モニター',
  entries: (n) => `${n} 件`,

  debug: 'デバッグ',

  all: 'すべて',
  network: 'ネットワーク',
  logs: 'ログ',
  ws: 'WS',
  fps: 'FPS',
  settings: '設定',

  search: '検索...',
  allFilter: 'すべて',
  success2xx3xx: '2xx/3xx',
  error4xx5xx: '4xx/5xx',

  empty: 'ログがありません',
  emptySubtitle: 'リクエストはここに自動で表示されます',

  deviceInfo: 'デバイス情報',
  advancedTools: '詳細ツール',
  selectSource: 'ソースを選択',
  manualEntry: '手動入力',
  customUrl: 'カスタム URL',
  manualUrlPlaceholder: 'https://api.example.com',

  applyChanges: '変更を適用',
  shareJsonReport: 'JSON レポートを共有',
  shareTextReport: 'テキストレポートを共有',
  saveJsonReportToFile: 'JSON をファイルに保存',
  saveTextReportToFile: 'テキストをファイルに保存',
  wipeAllRecords: 'すべての記録を削除',

  productionApi: '本番 API (PROD)',
  testApi: 'テスト API (TEST)',
  productive: '本番 (PROD)',
  demonstration: 'デモ (DEMO)',
  unknown: '不明',

  currentFps: '現在の FPS',
  averageFps: '平均 FPS',
  minFps: '最小 FPS',
  maxFps: '最大 FPS',
  droppedFrames: 'ドロップフレーム',
  fpsHistory: 'FPS 履歴 (直近 60 秒)',
  fpsMonitorActive: 'FPS モニター有効',
  fpsMonitorOff: 'FPS モニター無効',
  fpsEmpty: '上のトグルをタップして FPS 監視を開始',

  noWebSocketActivity: 'WEBSOCKET アクティビティなし',
  wsSubtitle: 'WebSocket 接続は自動的に傍受されます',
  wsOpen: 'オープン',
  wsClose: 'クローズ',
  wsError: 'エラー',
  wsMsg: 'メッセージ',

  device: 'デバイス',
  application: 'アプリ',
  platform: 'プラットフォーム',
  model: 'モデル',
  screen: '画面',
  appVersion: 'アプリバージョン',
  buildVersion: 'ビルドバージョン',

  consoleError: 'コンソールエラー',
  logMessage: 'ログメッセージ',
  websocketEvent: 'WEBSOCKET イベント',
  performanceData: 'パフォーマンスデータ',
  data: 'データ',
  method: 'メソッド',
  url: 'URL',
  headers: 'ヘッダー',
  statusCode: 'ステータスコード',
  body: 'ボディ',
  shareEntry: 'エントリを共有',
  shareCurl: 'cURL を共有',
  closeMenu: '閉じる',
  curlCommand: 'cURL コマンド',
  back: '戻る',
  request: 'リクエスト',
  response: 'レスポンス',
  close: '閉じる',
  exit: '終了',

  ms: 'ミリ秒',
  kb: 'KB',
  error: 'エラー',

  login: 'デバッグログイン',
  passPlaceholder: 'パスワードを入力',
  cancel: 'キャンセル',
  confirm: '確認',
  wrongPass: 'パスワードが違います',
  clicks: (n) => `${n} 回クリックを検出`,

  pleaseEnterUrl: 'URL を入力してください',
  urlMustStartWith: 'URL は http:// または https:// で始める必要があります',
  invalidDomainFormat:
    'ドメインの形式が無効です。例: https://api.example.com または http://localhost',
  invalidUrlFormat:
    'URL の形式が無効です。プロトコルを含めてください (例: https://api.example.com)',
  success: '成功',
  newSourceApplied: '新しいソースが適用されました',
  couldNotShareReport: 'レポートを共有できませんでした',
  couldNotShareLog: 'ログを共有できませんでした',
  couldNotShare: '共有できませんでした',
  reportTitle: 'ネットワークモニターエクスポートレポート',
  logShareTitle: 'ログエントリ',

  logChipError: 'エラー',

  store: 'ストア',
  action: 'アクション',
  state: '状態',
  prevState: '前の状態',
  nextState: '次の状態',
  diff: '差分',
  snapshot: 'スナップショット',
  noStoreActivity: '状態変更は記録されていません',
  storeSubtitle: '状態変更はミドルウェア経由で追跡されます',
  actionType: 'アクションタイプ',
  actionPayload: 'アクションペイロード',
  changedKeys: '変更されたキー',
  fullState: '完全な状態',
};

export const TRANSLATIONS: Record<ResolvedLanguage, Translation> = {
  en, az, ru, tr, hi, gu, es, fr, de, ar, zh, pt, ja,
};

export const resolveLanguage = (lang: LanguageCode): ResolvedLanguage => {
  if (lang === 'auto') return getDeviceLanguage();
  return lang;
};

export const getDeviceLanguage = (): ResolvedLanguage => {
  try {
    const locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;

    const lang = locale?.split(/[-_]/)[0] || 'en';
    if (TRANSLATIONS[lang as ResolvedLanguage]) return lang as ResolvedLanguage;
  } catch (e) {
    // ignore
  }
  return 'en';
};
