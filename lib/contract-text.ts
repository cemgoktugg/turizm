/**
 * Umre sözleşmesinin maddeleri (makbuzun altında yazdırılır; bkz.
 * components/admin/sales/contract.tsx). Metni değiştirmek için yalnızca bu
 * dosyayı düzenlemek yeterlidir. Her maddenin bir veya birkaç kalın başlıklı
 * parçası olabilir ([başlık, metin]).
 */
export type ContractClause = { letter?: string; parts: [title: string, text: string][] };
export type ContractSection = { title: string; clauses: ContractClause[] };

export const CONTRACT_TITLE = "UMRE HİZMET SÖZLEŞMESİ";

export const CONTRACT_SECTIONS: ContractSection[] = [
  {
    title: "1. ACENTE'YE AİT HAK VE YÜKÜMLÜLÜKLER",
    clauses: [
      {
        letter: "A",
        parts: [
          [
            "VİZE",
            "ACENTE, vize işlemlerinde Suudi Arabistan Büyükelçilik/Konsolosluk ile aracı konumundadır. Tüm evraklar tam olsa dahi Konsolosluk vize vermeyebilir. Vizeleri geç verebilir, buna bağlı seyahat gecikmeleri olabilir. Buradaki sorumluluk ACENTE'ye ait değildir.",
          ],
        ],
      },
      {
        letter: "B",
        parts: [
          [
            "HAVAYOLU",
            "ACENTE, havayolu ile UMRECİ arasında aracı konumunda olup, 28/09/1955 Lahey Protokolüne tabidir. Havayolu şirketleri tarafından yapılabilecek saat değişiklikleri ve olabilecek rötarlardan ACENTE sorumlu tutulamaz. Uçuşlarımız tarifeli ve/veya ekstra uçak seferleri ile özel ve/veya ulusal havayolları ile yapılabilir.",
          ],
        ],
      },
      {
        letter: "C",
        parts: [
          [
            "OTEL",
            "Otele giriş saati 15:00'tir; özellikle gece uçuşlarında, gece veya sabah otele giriş yapılırsa o gece konaklamaya dahildir. En geç otel çıkışımız 14:00'tür. 14:00'ten sonra yapılacak çıkışlarda 1 geceleme daha yapılmış sayılır. Özellikle 4-5 yıldızlı otel odaları genelde iki kişinin konaklaması için tasarlandığından, üçüncü kişi için eklenen yatak küçük ve daha az konforlu olacaktır. ACENTE'nin kataloglarında belirtmiş olduğu otel mesafeleri Mekke'de Harem-i Şerif'in, Medine'de ise Mescid-i Nebevi'nin avluları baz alınarak yazılmıştır. Bunu UMRECİ kabul ederek kaydını yaptırır.",
          ],
        ],
      },
      {
        letter: "D",
        parts: [
          [
            "TUR PROGRAMI",
            "UMRECİ, ACENTE programlarına dahil olduktan sonra, vize kaynaklı gecikmelerden veya Suudi Arabistan'ca first majör sayılan otelin yıkım kararı çıkması ve/veya kralın misafirlerinin rezervasyonlarının yapılması gibi konaklama otellerinde değişiklik durumunda ACENTE daima muadil otel kategorilerini baz alacaktır. ACENTE bu tip durumlarda UMRECİ'ye durumu bildirmekle yükümlüdür. ACENTE'nin bu bildiriyi e-mail, SMS, faks veya telefonla yapması yeterli kabul edilecektir. UMRECİ bu tip durumlarda arzu eder ise hiçbir masraf kesilmeden seyahatini iptal etme hakkını saklı tutar. Bu tip durumlarda ACENTE programı alt veya üst kategoriye alabilir. Bu durumlarda UMRECİ'nin tercihine göre, ACENTE üst kategori tercihinde ücret farkı talep eder, alt kategori tercihinde iade eder.",
          ],
        ],
      },
      {
        letter: "E",
        parts: [
          [
            "FESİH HAKLARI",
            "ACENTE kendi iradesi dışında oluşan nedenlerle veya tura katılan kişilerin yeterli sayıya ulaşamamasına bağlı olarak turları iptal etme hakkına sahiptir. Böyle bir durumda yolcuya yapılacak e-mail, SMS, faks veya telefon bildirimi yeterli kabul edilecektir. Burada müşterinin tazmin hakkı olamaz.",
          ],
        ],
      },
      {
        letter: "F",
        parts: [
          [
            "MÜCBİR SEBEPLER",
            "ACENTE ile ulaşım firmaları arasında yapılan anlaşmalar gereği ulaşım araçlarının programlarda belirtilen saatlerde hareket yerlerinde bulunmayarak gezilerin vaktinde başlayamaması, gecikmeleri; gezilerin uygulanması sırasında otobüs, uçak, vapur, tren vb. araçların gecikmeleri, arızalanmaları, kaza yapmaları; şoförlerin vb. hastalanmaları, ölmeleri, vizelerinin alınamayışı, şahsi kusurları; hava muhalefeti (sis, fırtına, kar yağışı, tipi, yıldırım düşmesi vb.), doğal afetler (deprem, sel, yangın, heyelan vb.), halk hareketleri (terör, grev, lokavt, miting, yürüyüş, yol kapanması, savaş, kargaşa durumları, olağanüstü hal vb.), sıkıyönetim, sokağa çıkma yasağı, seçimler vb., sağlık sorunları (salgın hastalıklar, karantina vb.) gibi ACENTE kusuru bulunmayan her türlü olay ve kazalardan ötürü ne şekilde olursa olsun ACENTE'ye maddi ve manevi sorumluluk yüklenemez. ACENTE buraya ilave edilmeyen mücbir sebeplerden doğan haklarını saklı tutar.",
          ],
        ],
      },
    ],
  },
  {
    title: "2. UMRECİ'YE AİT HAK VE YÜKÜMLÜLÜKLER",
    clauses: [
      {
        letter: "A",
        parts: [["BİLGİ", "UMRECİ'nin katılmış olduğu tur programı hakkında detaylı bilgi alma hakkı vardır. Bu bilgiyi ACENTE vermek zorundadır."]],
      },
      {
        letter: "B",
        parts: [
          [
            "PROGRAM",
            "UMRECİ, ACENTE tarafından düzenlenen Mekke ve Medine ziyaretlerine, özel umre programlarına katılmayabilir. ACENTE düzenlenen tur ve programı otelde ilan etmek zorundadır.",
          ],
          [
            "EVRAK",
            "Müşteri, seyahat tarihinden en az 20 gün önce vize işlemleri için gerekli evrakları ACENTE'ye teslim etmekle yükümlüdür. Bu evrakların gecikmesi ile oluşacak vize gecikmelerinden UMRECİ sorumludur.",
          ],
        ],
      },
      {
        letter: "C",
        parts: [
          [
            "ÜCRET",
            "UMRECİ kayıt esnasında katılmış olduğu tur ücretinin %50'sini, uçuş programından 1 hafta önce de kalan bakiyesini ACENTE'ye ödemekle yükümlüdür.",
          ],
        ],
      },
      {
        letter: "D",
        parts: [
          [
            "HASTALIK",
            "Suudi Arabistan'da veya bağlantılı noktaların ilgili duraklarında rahatsızlanan umrecilerin tedavi masrafları umrecilere aittir. Suudi Arabistan Krallığı'na ait hastanelerin uygulaması ücretsizdir. Özel hastane tedavileri ücretlidir. Umrecilerin felç veya yatalak durumda olmaları halinde dönüş uçağında alınacak ek koltuk masrafları umreciye aittir. ACENTE, UMRECİ'yi tedavi için hastaneye götürmek, haklarını anlatmak ve bilgilendirmekle yükümlüdür.",
          ],
        ],
      },
      {
        letter: "E",
        parts: [
          [
            "BAGAJ / VALİZ",
            "Uçaklı seyahatlerde havayollarının açıklamış olduğu bagaj kg ve/veya hacim hakkı vardır. Fazla bagaj ücretleri UMRECİ'lerimize aittir. Bagajların gidiş ve dönüşte havayolu ve yerel otobüs firmalarında, konaklanan otelde; valizlerin ve içindeki eşyaların her türlü kaybından, hasara uğramasından, unutulmasından UMRECİ sorumludur, ACENTE sorumlu değildir. ACENTE hiçbir suretle UMRECİ'nin eşyalarından sorumlu tutulamaz. Valizlerin ve içindeki eşyanın her türlü sorumluluğu sahiplerine aittir. Kokan, akan, yanıcı veya patlayıcı vasıfları olan veya çevresine rahatsızlık veren eşyalar taşıt araçlarına alınmaz; taşıyıcı firma kabul etmeyebilir, bundan ACENTE sorumlu tutulamaz.",
          ],
        ],
      },
      {
        parts: [
          [
            "UÇUŞ",
            "Uçuş öncesinde saatler değişebilir; UMRECİ'nin uçuş saatini en az 48 saat önce ACENTE'den teyit etmesi gerekmektedir. UMRECİ'nin kalkıştan en az 3 saat önce havalimanında hazır olması gerekmektedir. UMRECİ'nin ikametinden veya bulunduğu yerden gidiş ve dönüşlerde Türkiye sınırlarındaki havalimanı ulaşımları UMRECİ'ye aittir.",
          ],
        ],
      },
      {
        parts: [
          [
            "DÖNÜŞ",
            "Yolcu gittikten sonra herhangi bir sebeple erken dönmek isteyen umrecilerimize (otel, uçak, vize ve diğer hizmetler için ödemeler önceden yapıldığından) herhangi bir ücret iadesi yapılmaz. Yolcu gittikten sonra kendi bileti ile erken dönmek ister ise bu ancak kullanılan havayolunun uçaklarının müsaitlik durumuna göre olabilecektir. Bu erken dönüşten dolayı havayolunun talep ettiği ekstra bir fark olur ise yolcu bunu ödemeyi kabul eder. Kendi bileti buna müsait değil ise arzu ederse, ücretini ödemek koşulu ile başka havayoluna ait bir dönüş bileti ile de dönebilecektir. Bu ücretin şirketimizle hiçbir ilgisi yoktur.",
          ],
        ],
      },
    ],
  },
];
