import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function LegalModal({ isOpen, onClose, title, children }: LegalModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-background flex flex-col"
        >
          {/* Header */}
          <header className="border-b bg-card px-4 py-3 md:py-4 sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">
                {title}
              </h2>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </header>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="container mx-auto px-4 py-8 md:py-12">
              <div className="max-w-3xl mx-auto">
                {children}
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TermsOfServiceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <LegalModal isOpen={isOpen} onClose={onClose} title="Uslovi korišćenja">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Uslovi korišćenja</h1>
          <p className="text-muted-foreground">Poslednje ažuriranje: {new Date().toLocaleDateString('sr-RS')}</p>
        </div>

        <div className="space-y-6 text-foreground/90">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Opšte odredbe</h2>
            <p>
              Dobrodošli na Jeftino.rs. Ovi uslovi korišćenja definišu pravila i propise za korišćenje naše internet prodavnice.
              Pristupanjem ovom sajtu pretpostavljamo da prihvatate ove uslove i odredbe u potpunosti.
              Nemojte nastaviti da koristite Jeftino.rs ako ne prihvatate sve uslove i odredbe navedene na ovoj stranici.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Način isporuke</h2>
            <p>
              Isporuka se vrši putem kurirske službe na teritoriji Republike Srbije. 
              Rok za isporuku je obično 2-5 radnih dana od trenutka potvrde porudžbine.
              Troškove dostave snosi kupac, osim ako nije drugačije naznačeno u okviru posebnih akcija.
              Kurirska služba će vas kontaktirati pre isporuke putem telefona koji ste ostavili prilikom poručivanja.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Pravo na povraćaj robe</h2>
            <p>
              U skladu sa Zakonom o zaštiti potrošača, kupac ima pravo da odustane od ugovora zaključenog na daljinu
              u roku od 14 dana od dana prijema robe, bez navođenja razloga.
            </p>
            <p>
              Da biste ostvarili pravo na odustanak, potrebno je da nas obavestite o svojoj odluci pre isteka roka od 14 dana.
              Proizvod koji vraćate mora biti nekorišćen, neoštećen i u originalnoj ambalaži, sa svim pripadajućim etiketama.
            </p>
            <p>
              Troškove vraćanja robe snosi kupac, osim u slučajevima kada je isporučeni proizvod neispravan ili pogrešan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Reklamacije</h2>
            <p>
              Ukoliko primetite da je paket oštećen prilikom preuzimanja, niste dužni da ga preuzmete.
              U slučaju da ste proizvod preuzeli i naknadno uvideli oštećenje ili nesaobraznost, molimo vas da nas kontaktirate
              u najkraćem roku kako bismo rešili problem (zamenili artikal ili izvršili povraćaj novca).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Cene i plaćanje</h2>
            <p>
              Sve cene su izražene u dinarima (RSD). Zadržavamo pravo promene cena bez prethodne najave.
              Plaćanje se vrši pouzećem (gotovinski prilikom preuzimanja paketa).
            </p>
          </section>
        </div>
      </div>
    </LegalModal>
  );
}

export function PrivacyPolicyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <LegalModal isOpen={isOpen} onClose={onClose} title="Politika privatnosti">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Politika privatnosti</h1>
          <p className="text-muted-foreground">Poslednje ažuriranje: {new Date().toLocaleDateString('sr-RS')}</p>
        </div>

        <div className="space-y-6 text-foreground/90">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Uvod</h2>
            <p>
              Vaša privatnost nam je veoma važna. Ova Politika privatnosti objašnjava kako Jeftino.rs prikuplja,
              koristi i štiti vaše lične podatke kada posetite naš sajt ili izvršite kupovinu.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Podaci koje prikupljamo</h2>
            <p>
              Prilikom poručivanja proizvoda, možemo prikupiti sledeće podatke:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Ime i prezime</li>
              <li>Adresa za isporuku</li>
              <li>Broj telefona</li>
              <li>Email adresa</li>
            </ul>
            <p>
              Ovi podaci su nam neophodni kako bismo obradili vašu porudžbinu i isporučili robu na željenu adresu.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Upotreba podataka</h2>
            <p>
              Prikupljene podatke koristimo isključivo u sledeće svrhe:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Obrada i isporuka porudžbina</li>
              <li>Komunikacija sa vama u vezi sa statusom porudžbine</li>
              <li>Rešavanje reklamacija i povraćaja robe</li>
              <li>Poboljšanje korisničkog iskustva na našem sajtu</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Zaštita podataka</h2>
            <p>
              Preduzimamo odgovarajuće tehničke i organizacione mere kako bismo zaštitili vaše lične podatke od
              neovlašćenog pristupa, gubitka ili zloupotrebe. Vaši podaci se čuvaju u sigurnom okruženju i dostupni su
              samo zaposlenima kojima su neophodni za obavljanje posla.
            </p>
            <p>
              Vaše lične podatke ne delimo sa trećim licima, osim sa kurirskim službama u meri u kojoj je to neophodno
              za isporuku paketa.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Kolačići (Cookies)</h2>
            <p>
              Naš sajt koristi kolačiće kako bi vam pružio bolje korisničko iskustvo. Kolačići su male tekstualne datoteke
              koje se čuvaju na vašem uređaju. Možete podesiti svoj pretraživač da odbije kolačiće, ali u tom slučaju
              neki delovi sajta možda neće funkcionisati ispravno.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Vaša prava</h2>
            <p>
              Imate pravo da zatražite uvid u podatke koje imamo o vama, kao i da zatražite njihovu ispravku ili brisanje.
              Ukoliko imate bilo kakvih pitanja u vezi sa našom politikom privatnosti, slobodno nas kontaktirajte.
            </p>
          </section>
        </div>
      </div>
    </LegalModal>
  );
}
